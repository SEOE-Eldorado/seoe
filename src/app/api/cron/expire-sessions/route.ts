import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@shared/api/firebase-admin";

// This endpoint should be called by a cron job every 1 minute
// Set it up in Dokploy with schedule: "*/1 * * * *"
// Or use an external cron service like cron-job.org to hit this endpoint

export async function GET(request: NextRequest) {
  // Optional: simple secret check to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET || "your-cron-secret-here";

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    // In development or if no secret set, allow anyway
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const nowMillis = now.getTime();
    const fifteenMinutesLater = new Date(nowMillis + 15 * 60 * 1000);

    // Find active sessions ending within 15 minutes
    const sessionsSnap = await adminDb
      .collection("parking_sessions")
      .where("status", "==", "active")
      .get();

    let processed = 0;

    for (const doc of sessionsSnap.docs) {
      const data = doc.data();
      const endTime = data.endTime;

      // Handle both Timestamp and plain Date
      let endTimeDate: Date;
      if (endTime && typeof endTime.toDate === "function") {
        endTimeDate = endTime.toDate();
      } else if (endTime instanceof Date) {
        endTimeDate = endTime;
      } else {
        endTimeDate = new Date(endTime);
      }

      const endTimeMillis = endTimeDate.getTime();
      const diffMillis = endTimeMillis - nowMillis;
      const diffMinutes = Math.floor(diffMillis / (1000 * 60));

      // Case A: Expired -> Complete session
      if (diffMinutes <= 0) {
        await doc.ref.update({ status: "completed" });

        await adminDb.collection("notifications").add({
          userId: data.userId,
          type: "parking_expired",
          title: "Estacionamiento Finalizado",
          message: "Tu tiempo de estacionamiento ha finalizado y la sesión se ha cerrado automáticamente.",
          date: new Date(),
          read: false,
          priority: "medium",
          actionUrl: "/history",
        });
        processed++;
      }
      // Case B: 5 minutes remaining
      else if (diffMinutes <= 5 && diffMinutes > 0 && !data.warned_5m) {
        await doc.ref.update({ warned_5m: true });
        await adminDb.collection("notifications").add({
          userId: data.userId,
          type: "parking_expiring",
          title: "¡5 minutos restantes!",
          message: "Tu estacionamiento finaliza en 5 minutos. Extiende ahora para evitar infracciones.",
          date: new Date(),
          read: false,
          priority: "urgent",
          actionUrl: "/activeParking",
        });
        processed++;
      }
      // Case C: 10 minutes remaining
      else if (diffMinutes <= 10 && diffMinutes > 5 && !data.warned_10m) {
        await doc.ref.update({ warned_10m: true });
        await adminDb.collection("notifications").add({
          userId: data.userId,
          type: "parking_expiring",
          title: "Tu estacionamiento vence pronto",
          message: `Quedan ${diffMinutes} minutos de estacionamiento.`,
          date: new Date(),
          read: false,
          priority: "high",
          actionUrl: "/activeParking",
        });
        processed++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      checkedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("checkParkingExpirations error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
