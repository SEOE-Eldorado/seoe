import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const addBalanceSchema = z.object({
  target: z.string().min(1), // email o patente
  targetType: z.enum(["email", "plate"]),
  amount: z.number().positive(),
  method: z.enum(["cash", "transfer", "card"]).default("cash"),
  notes: z.string().optional(),
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
    const data = addBalanceSchema.safeParse(body);
    if (!data.success) {
      return NextResponse.json(
        { error: `Datos inválidos: ${data.error.errors.map(e => e.message).join(", ")}` },
        { status: 400 }
      );
    }

    const { target, targetType, amount, method, notes } = data.data;

    // 4. Buscar usuario destino
    let targetUid: string;
    let targetUserData: any;

    if (targetType === "email") {
      try {
        const userRecord = await adminAuth.getUserByEmail(target);
        targetUid = userRecord.uid;
      } catch {
        return NextResponse.json({ error: `No existe usuario con email ${target}` }, { status: 404 });
      }
    } else {
      // Buscar por patente: primero buscar en vehicles
      const vehiclesSnap = await adminDb
        .collection("vehicles")
        .where("plate", "==", target.toUpperCase())
        .limit(1)
        .get();

      if (vehiclesSnap.empty) {
        return NextResponse.json({ error: `No se encontró vehículo con patente ${target}` }, { status: 404 });
      }

      targetUid = vehiclesSnap.docs[0].data().userId;
    }

    // Obtener datos del usuario destino
    const targetUserDoc = await adminDb.collection("users").doc(targetUid).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: "Usuario destino no encontrado" }, { status: 404 });
    }
    targetUserData = targetUserDoc.data();

    // 5. Ejecutar transacción: actualizar balance + registrar movimiento
    const userRef = adminDb.collection("users").doc(targetUid);
    await userRef.update({
      balance: FieldValue.increment(amount),
    });

    // 6. Registrar movimiento del usuario
    const transactionRef = adminDb.collection("transactions").doc();
    await transactionRef.set({
      userId: targetUid,
      userName: targetUserData.name || target,
      type: "credit",
      amount,
      method,
      description: `Carga de saldo por vendedor: ${sellerDoc.data()?.name || sellerUid}`,
      status: "completed",
      timestamp: FieldValue.serverTimestamp(),
      sellerId: sellerUid,
      sellerName: sellerDoc.data()?.name || "Vendedor",
    });

    // 7. Registrar transacción del vendedor
    const sellerTxRef = adminDb.collection("seller_transactions").doc();
    await sellerTxRef.set({
      sellerId: sellerUid,
      sellerName: sellerDoc.data()?.name || "Vendedor",
      type: "recharge",
      targetUserId: targetUid,
      targetName: targetUserData.name || target,
      targetEmail: targetUserData.email || "",
      targetPlate: targetType === "plate" ? target.toUpperCase() : "",
      amount,
      method,
      notes: notes || "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `Carga exitosa: $${amount.toLocaleString("es-AR")} a ${targetUserData.name || target}`,
      targetUser: {
        name: targetUserData.name,
        email: targetUserData.email,
        balance: (targetUserData.balance || 0) + amount,
      },
    });
  } catch (error: any) {
    console.error("seller add-balance error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
