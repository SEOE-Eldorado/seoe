import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación de admin
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

    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // 2. Obtener todos los vendedores
    const sellersSnap = await adminDb
      .collection("users")
      .where("role", "==", "seller")
      .get();

    const sellers: any[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const doc of sellersSnap.docs) {
      const sellerData = doc.data();

      // Obtener stats del vendedor (hoy)
      const todayTxSnap = await adminDb
        .collection("seller_transactions")
        .where("sellerId", "==", doc.id)
        .where("createdAt", ">=", todayStart)
        .get();

      let todayAmount = 0;
      let todayCount = 0;
      todayTxSnap.forEach(tx => {
        todayAmount += tx.data().amount || 0;
        todayCount++;
      });

      sellers.push({
        id: doc.id,
        name: sellerData.name,
        email: sellerData.email,
        active: sellerData.active !== false,
        createdAt: sellerData.createdAt?.toDate?.()?.toISOString() || sellerData.createdAt,
        stats: {
          todayAmount,
          todayCount,
        },
      });
    }

    return NextResponse.json({ success: true, sellers });
  } catch (error: any) {
    console.error("admin sellers list error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
