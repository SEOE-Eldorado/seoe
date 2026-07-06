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

    // 2. Obtener stats globales de vendedores
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Todas las transacciones de vendedores (hoy)
    const todayTxSnap = await adminDb
      .collection("seller_transactions")
      .where("createdAt", ">=", todayStart)
      .get();

    // Todas (semana)
    const weekTxSnap = await adminDb
      .collection("seller_transactions")
      .where("createdAt", ">=", weekStart)
      .get();

    // Todas (mes)
    const monthTxSnap = await adminDb
      .collection("seller_transactions")
      .where("createdAt", ">=", monthStart)
      .get();

    // Cálculo de stats
    let todayAmount = 0, todayCount = 0;
    let weekAmount = 0, weekCount = 0;
    let monthAmount = 0, monthCount = 0;

    const sellerSales: Record<string, { name: string; amount: number; count: number }> = {};

    monthTxSnap.forEach(doc => {
      const tx = doc.data();
      const createdAt = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
      monthAmount += tx.amount || 0;
      monthCount++;

      if (createdAt >= todayStart) {
        todayAmount += tx.amount || 0;
        todayCount++;
      }
      if (createdAt >= weekStart) {
        weekAmount += tx.amount || 0;
        weekCount++;
      }

      // Agrupar por vendedor
      const sid = tx.sellerId;
      if (sid) {
        if (!sellerSales[sid]) {
          sellerSales[sid] = { name: tx.sellerName || sid, amount: 0, count: 0 };
        }
        sellerSales[sid].amount += tx.amount || 0;
        sellerSales[sid].count++;
      }
    });

    // Top 10 vendedores
    const topSellers = Object.entries(sellerSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        today: { amount: todayAmount, count: todayCount },
        week: { amount: weekAmount, count: weekCount },
        month: { amount: monthAmount, count: monthCount },
      },
      topSellers,
    });
  } catch (error: any) {
    console.error("admin sellers stats error:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
