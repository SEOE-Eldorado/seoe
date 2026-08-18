import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const extendParkingSchema = z.object({
    sessionId: z.string().min(1),
    additionalHours: z.number().int().min(1).max(12),
});

/**
 * POST /api/parking/extend
 *
 * FIX bug 0.7 (race condition): misma técnica que /start — todo dentro de
 * `db.runTransaction` con `FieldValue.increment` para que el saldo se
 * decremente y la sesión se extienda atómicamente.
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const body = await request.json();
        const data = extendParkingSchema.safeParse(body);

        if (!data.success) {
            return NextResponse.json(
                { error: `Invalid request: ${data.error.errors.map(e => e.message).join(", ")}` },
                { status: 400 }
            );
        }

        const { sessionId, additionalHours } = data.data;
        const sessionRef = adminDb.collection("parking_sessions").doc(sessionId);
        const userRef = adminDb.collection("users").doc(userId);

        const result = await adminDb.runTransaction(async (tx) => {
            const sessionDoc = await tx.get(sessionRef);
            if (!sessionDoc.exists) {
                throw { code: "SESSION_NOT_FOUND", message: "Session not found" };
            }
            const sessionData = sessionDoc.data()!;
            if (sessionData.userId !== userId) {
                throw { code: "FORBIDDEN", message: "Not your session" };
            }
            if (sessionData.status !== "active") {
                throw { code: "INVALID_STATE", message: "Session not active" };
            }

            const userDoc = await tx.get(userRef);
            if (!userDoc.exists) {
                throw { code: "USER_NOT_FOUND", message: "User not found" };
            }
            const balance = userDoc.data()?.balance || 0;
            const costPerHour = sessionData.costPerHour;
            const additionalCost = additionalHours * costPerHour;

            if (balance - additionalCost < -200) {
                throw {
                    code: "INSUFFICIENT_FUNDS",
                    message: "Insufficient funds",
                    balance,
                    additionalCost,
                };
            }

            const currentEndTime = sessionData.endTime?.toDate();
            if (!currentEndTime) {
                throw { code: "INVALID_STATE", message: "Invalid session endTime" };
            }
            const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000);

            tx.update(userRef, { balance: FieldValue.increment(-additionalCost) });
            tx.update(sessionRef, {
                endTime: Timestamp.fromDate(newEndTime),
                extendedAt: FieldValue.serverTimestamp(),
            });

            return { newBalance: balance - additionalCost, newEndTime };
        });

        return NextResponse.json({
            success: true,
            newBalance: result.newBalance,
            newEndTime: result.newEndTime.toISOString(),
        });
    } catch (error: any) {
        const code = error?.code;
        if (code === "SESSION_NOT_FOUND" || code === "USER_NOT_FOUND") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (code === "FORBIDDEN") {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (code === "INSUFFICIENT_FUNDS") {
            return NextResponse.json(
                {
                    error: error.message,
                    code,
                    balance: error.balance,
                    additionalCost: error.additionalCost,
                },
                { status: 409 }
            );
        }
        if (code === "INVALID_STATE") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error("extendParking error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal error" },
            { status: 500 }
        );
    }
}
