import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

export async function GET(request: NextRequest) {
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

    // Verificar que sea admin, seller o inspector
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const role = callerDoc.data()?.role;
    if (role !== "admin" && role !== "seller" && role !== "inspector") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const plate = searchParams.get("plate");

    if (email) {
      // Buscar por email
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(email);
      } catch {
        return NextResponse.json({ error: `No existe usuario con email ${email}` }, { status: 404 });
      }

      const userDoc = await adminDb.collection("users").doc(userRecord.uid).get();
      const userData = userDoc.data() || {};

      return NextResponse.json({
        success: true,
        user: {
          uid: userRecord.uid,
          name: userData.name || userRecord.displayName || email.split("@")[0],
          email: userRecord.email,
          balance: userData.balance || 0,
          role: userData.role || "user",
        },
      });
    }

    if (plate) {
      // Buscar por patente
      const cleanPlate = plate.trim().toUpperCase();
      const vehiclesSnap = await adminDb
        .collection("vehicles")
        .where("plate", "==", cleanPlate)
        .limit(1)
        .get();

      if (vehiclesSnap.empty) {
        return NextResponse.json({ error: `No se encontró vehículo con patente ${cleanPlate}` }, { status: 404 });
      }

      const vehicleData = vehiclesSnap.docs[0].data();
      const vehicleId = vehiclesSnap.docs[0].id;
      const userId = vehicleData.userId;

      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "Usuario propietario no encontrado" }, { status: 404 });
      }

      const userData = userDoc.data();

      return NextResponse.json({
        success: true,
        user: {
          uid: userId,
          name: userData?.name || "Sin nombre",
          email: userData?.email || "",
          balance: userData?.balance || 0,
          role: userData?.role || "user",
        },
        vehicle: {
          id: vehicleId,
          plate: cleanPlate,
          brand: vehicleData.brand,
          model: vehicleData.model,
          color: vehicleData.color,
        },
      });
    }

    return NextResponse.json({ error: "Debe proporcionar email o plate" }, { status: 400 });
  } catch (error: any) {
    console.error("find-user error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
