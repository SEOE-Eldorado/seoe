import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const startParkingSchema = z.object({
  plate: z.string().min(1).max(10),
  zone: z.string().min(1),
  address: z.string().optional().default(""),
  hours: z.number().int().min(1).max(24),
  costPerHour: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const sellerUid = decodedToken.uid;

    // 2. Verificar que sea seller o admin
    const sellerDoc = await adminDb.collection("users").doc(sellerUid).get();
    if (!sellerDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const sellerRole = sellerDoc.data()?.role;
    if (sellerRole !== "seller" && sellerRole !== "admin") {
      return NextResponse.json({ error: "Solo vendedores pueden usar este endpoint" }, { status: 403 });
    }

    // 3. Validar body
    const body = await request.json();
    const data = startParkingSchema.safeParse(body);
    if (!data.success) {
      return NextResponse.json(
        { error: `Datos inválidos: ${data.error.errors.map(e => e.message).join(", ")}` },
        { status: 400 }
      );
    }

    const { plate, zone, address, hours, costPerHour } = data.data;
    const cleanPlate = plate.trim().toUpperCase();

    // 4. Buscar vehículo por patente
    const vehiclesSnap = await adminDb
      .collection("vehicles")
      .where("plate", "==", cleanPlate)
      .limit(1)
      .get();

    if (vehiclesSnap.empty) {
      return NextResponse.json({ error: `No se encontró vehículo con patente ${cleanPlate}. El usuario debe registrar su vehículo primero.` }, { status: 404 });
    }

    const vehicleData = vehiclesSnap.docs[0].data();
    const vehicleId = vehiclesSnap.docs[0].id;
    const targetUserId = vehicleData.userId;

    // 5. Obtener datos del usuario
    const userDoc = await adminDb.collection("users").doc(targetUserId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const userData = userDoc.data();
    const balance = userData?.balance || 0;
    const cost = hours * costPerHour;

    if (balance - cost < -200) {
      return NextResponse.json({ error: `Saldo insuficiente. El usuario tiene $${balance.toLocaleString("es-AR")} y necesita $${cost.toLocaleString("es-AR")}` }, { status: 400 });
    }

    // 6. Verificar que no tenga estacionamiento activo
    const activeSessions = await adminDb
      .collection("parking_sessions")
      .where("userId", "==", targetUserId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!activeSessions.empty) {
      return NextResponse.json({ error: `El usuario ya tiene un estacionamiento activo (patente ${activeSessions.docs[0].data().vehiclePlate})` }, { status: 400 });
    }

    // 7. Crear sesión de estacionamiento
    const startTime = new Date();
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);
    const sessionRef = adminDb.collection("parking_sessions").doc();

    const batch = adminDb.batch();

    // Descontar saldo
    batch.update(adminDb.collection("users").doc(targetUserId), {
      balance: FieldValue.increment(-cost),
    });

    // Crear sesión
    batch.set(sessionRef, {
      userId: targetUserId,
      vehicleId,
      vehiclePlate: cleanPlate,
      zone,
      address,
      startTime,
      endTime,
      cost,
      costPerHour,
      status: "active",
      startedBy: "seller",
      startedBySellerId: sellerUid,
      startedBySellerName: sellerDoc.data()?.name || "Vendedor",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Registrar transacción del vendedor
    const sellerTxRef = adminDb.collection("seller_transactions").doc();
    batch.set(sellerTxRef, {
      sellerId: sellerUid,
      sellerName: sellerDoc.data()?.name || "Vendedor",
      type: "parking",
      targetUserId,
      targetName: userData?.name || "",
      targetPlate: cleanPlate,
      amount: cost,
      zone,
      hours,
      sessionId: sessionRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Estacionamiento iniciado para ${cleanPlate} en ${zone} por ${hours}h — Total: $${cost.toLocaleString("es-AR")}`,
      session: {
        id: sessionRef.id,
        plate: cleanPlate,
        zone,
        startTime,
        endTime,
        cost,
      },
      user: {
        name: userData?.name,
        email: userData?.email,
        remainingBalance: balance - cost,
      },
    });
  } catch (error: any) {
    console.error("seller start-parking error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
