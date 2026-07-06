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

    const sellerUid = decodedToken.uid;

    // 2. Verificar que sea seller o admin
    const sellerDoc = await adminDb.collection("users").doc(sellerUid).get();
    if (!sellerDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const sellerRole = sellerDoc.data()?.role;
    if (sellerRole !== "seller" && sellerRole !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // 3. Obtener stats del vendedor
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Todas las transacciones del vendedor
    const allTxSnap = await adminDb
      .collection("seller_transactions")
      .where("sellerId", "==", sellerUid)
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    let totalAmount = 0;
    let todayAmount = 0;
    let weekAmount = 0;
    let todayCount = 0;
    let weekCount = 0;
    let totalCount = 0;
    let rechargeCount = 0;
    let parkingCount = 0;
    let recentTx: any[] = [];

    allTxSnap.forEach(doc => {
      const tx = doc.data();
      const createdAt = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
      totalAmount += tx.amount || 0;
      totalCount++;

      if (tx.type === "recharge") rechargeCount++;
      if (tx.type === "parking") parkingCount++;

      if (createdAt >= todayStart) {
        todayAmount += tx.amount || 0;
        todayCount++;
      }

      if (createdAt >= weekStart) {
        weekAmount += tx.amount || 0;
        weekCount++;
      }

      if (recentTx.length < 10) {
        recentTx.push({
          id: doc.id,
          type: tx.type,
          amount: tx.amount,
          targetName: tx.targetName,
          targetPlate: tx.targetPlate,
          createdAt: createdAt.toISOString(),
        });
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        today: { amount: todayAmount, count: todayCount },
        week: { amount: weekAmount, count: weekCount },
        total: { amount: totalAmount, count: totalCount },
        rechargeCount,
        parkingCount,
      },
      recentTransactions: recentTx,
      seller: {
        name: sellerDoc.data()?.name,
        email: sellerDoc.data()?.email,
      },
    });
  } catch (error: any) {
    console.error("seller stats error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
