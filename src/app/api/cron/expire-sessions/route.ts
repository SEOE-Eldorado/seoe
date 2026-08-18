import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@shared/api/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

/**
 * POST /api/cron/expire-sessions
 *
 * FIX bug 0.8:
 *   1. Método: GET → POST (REST anti-pattern: GET que muta estado)
 *   2. Secret: comparación con timingSafeEqual (evita timing attacks)
 *   3. Lock: document dedicado `cron_locks/expire-sessions` con TTL 60s
 *           (evita que múltiples crons en paralelo dupliquen notificaciones)
 *   4. En producción REQUIERE `CRON_SECRET` configurado.
 *      Sin secret configurado, el endpoint rechaza con 503.
 *
 * Setup del cron (en Dokploy o servicio externo como cron-job.org):
 *   URL:    https://seoe.eldorado.gob.ar/api/cron/expire-sessions
 *   Method: POST
 *   Headers: Authorization: Bearer [CRON_SECRET]
 *   Schedule: cada 1 minuto (cron: star-slash-1 star star star star)
 */
export async function POST(request: NextRequest) {
    // ── 1. Secret validation (timingSafeEqual) ──────────────────────
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET) {
        console.error("[cron] CRON_SECRET no está configurado. Abortando.");
        return NextResponse.json(
            { error: "CRON_SECRET no configurado. Configure esta env var antes de llamar al endpoint." },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${CRON_SECRET}`;
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Lock distribuido (evita crons paralelos) ─────────────────
    const lockRef = adminDb.collection("cron_locks").doc("expire-sessions");
    const now = Timestamp.now();
    const LOCK_TTL_SEC = 60;

    try {
        const lockResult = await adminDb.runTransaction(async (tx) => {
            const lockDoc = await tx.get(lockRef);
            if (lockDoc.exists) {
                const lockData = lockDoc.data()!;
                const lastRun = lockData.lastRun?.toDate?.() || new Date(0);
                const secondsSinceLastRun = (Date.now() - lastRun.getTime()) / 1000;
                if (secondsSinceLastRun < LOCK_TTL_SEC) {
                    // Otro cron está corriendo o corrió hace poco
                    return {
                        acquired: false,
                        secondsSinceLastRun: Math.floor(secondsSinceLastRun),
                    };
                }
            }
            // Adquirir lock
            tx.set(lockRef, {
                lastRun: now,
                acquiredAt: now,
            });
            return { acquired: true };
        });

        if (!lockResult.acquired) {
            return NextResponse.json({
                ok: true,
                skipped: true,
                reason: `Lock activo (último run hace ${lockResult.secondsSinceLastRun}s)`,
                checkedAt: new Date().toISOString(),
            });
        }
    } catch (lockError: any) {
        console.error("[cron] Error adquiriendo lock:", lockError.message);
        // Continuar de todas formas (fail-open) — preferible perder idempotencia
        // a perder el procesamiento del cron.
    }

    // ── 3. Procesar sesiones ────────────────────────────────────────
    try {
        const nowMillis = Date.now();
        const nowDate = new Date(nowMillis);

        // Query: sesiones activas
        // NOTA: el query no filtra por endTime porque queremos detectar
        // tanto las que están por expirar (10min, 5min) como las que ya expiraron.
        const sessionsSnap = await adminDb
            .collection("parking_sessions")
            .where("status", "==", "active")
            .get();

        let processed = 0;
        const details = { expired: 0, warned5m: 0, warned10m: 0 };

        for (const doc of sessionsSnap.docs) {
            const data = doc.data();
            const endTime = data.endTime;

            // Normalizar endTime a Date
            let endTimeDate: Date;
            if (endTime && typeof endTime.toDate === "function") {
                endTimeDate = endTime.toDate();
            } else if (endTime instanceof Date) {
                endTimeDate = endTime;
            } else {
                endTimeDate = new Date(endTime);
            }

            const diffMillis = endTimeDate.getTime() - nowMillis;
            const diffMinutes = Math.floor(diffMillis / (1000 * 60));

            // Case A: ya expiró → cerrar sesión
            if (diffMinutes <= 0) {
                await doc.ref.update({ status: "completed" });
                await adminDb.collection("notifications").add({
                    userId: data.userId,
                    type: "parking_expired",
                    title: "Estacionamiento Finalizado",
                    message: "Tu tiempo de estacionamiento ha finalizado y la sesión se ha cerrado automáticamente.",
                    date: nowDate,
                    read: false,
                    priority: "medium",
                    actionUrl: "/history",
                });
                processed++;
                details.expired++;
            }
            // Case B: 5 min restantes
            else if (diffMinutes <= 5 && diffMinutes > 0 && !data.warned_5m) {
                await doc.ref.update({ warned_5m: true });
                await adminDb.collection("notifications").add({
                    userId: data.userId,
                    type: "parking_expiring",
                    title: "¡5 minutos restantes!",
                    message: "Tu estacionamiento finaliza en 5 minutos. Extiende ahora para evitar infracciones.",
                    date: nowDate,
                    read: false,
                    priority: "urgent",
                    actionUrl: "/activeParking",
                });
                processed++;
                details.warned5m++;
            }
            // Case C: 10 min restantes
            else if (diffMinutes <= 10 && diffMinutes > 5 && !data.warned_10m) {
                await doc.ref.update({ warned_10m: true });
                await adminDb.collection("notifications").add({
                    userId: data.userId,
                    type: "parking_expiring",
                    title: "Tu estacionamiento vence pronto",
                    message: `Quedan ${diffMinutes} minutos de estacionamiento.`,
                    date: nowDate,
                    read: false,
                    priority: "high",
                    actionUrl: "/activeParking",
                });
                processed++;
                details.warned10m++;
            }
        }

        // Liberar lock inmediatamente (no esperamos 60s)
        // para que si el cron termina antes, el siguiente pueda correr
        try {
            await lockRef.delete();
        } catch (e) {
            // Si falla el delete, no importa — el TTL de 60s lo limpia eventualmente
        }

        return NextResponse.json({
            ok: true,
            processed,
            details,
            checkedAt: nowDate.toISOString(),
        });
    } catch (error: any) {
        console.error("[cron] checkParkingExpirations error:", error);
        // Liberar lock también en error
        try { await lockRef.delete(); } catch {}
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
