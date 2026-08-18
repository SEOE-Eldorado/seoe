import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const startParkingSchema = z.object({
    vehicleId: z.string().min(1),
    zone: z.string().min(1),
    address: z.string().min(1),
    hours: z.number().int().min(1).max(24),
    costPerHour: z.number().positive(),
    vehiclePlate: z.string().min(1).max(10),
});

/**
 * POST /api/parking/start
 *
 * FIX bug 0.7 (race condition): la versión original leía `userDoc.data().balance`,
 * validaba `balance - cost < -200`, y luego hacía `userRef.update({ balance: balance - cost })`
 * SIN transacción. Dos requests concurrentes podían gastar doble.
 *
 * Ahora: `db.runTransaction` con `FieldValue.increment` es atómico.
 * El saldo se decrementa y la sesión se crea en la misma transacción.
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
        const data = startParkingSchema.safeParse(body);

        if (!data.success) {
            return NextResponse.json(
                { error: `Invalid request: ${data.error.errors.map(e => e.message).join(", ")}` },
                { status: 400 }
            );
        }

        const { vehicleId, zone, address, hours, costPerHour, vehiclePlate } = data.data;
        const cost = hours * costPerHour;
        const userRef = adminDb.collection("users").doc(userId);
        const sessionRef = adminDb.collection("parking_sessions").doc();

        const startTime = new Date();
        const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);

        // Transacción atómica: lee el saldo, valida, decrementa y crea la sesión.
        // Si dos requests concurrentes intentan gastar el mismo saldo, Firestore
        // serializa las transacciones a nivel de documento y la segunda falla
        // con `balance - cost < -200` sin llegar a debitar.
        const result = await adminDb.runTransaction(async (tx) => {
            const userDoc = await tx.get(userRef);
            if (!userDoc.exists) {
                throw { code: "USER_NOT_FOUND", message: "User not found" };
            }

            const balance = userDoc.data()?.balance || 0;
            if (balance - cost < -200) {
                throw {
                    code: "INSUFFICIENT_FUNDS",
                    message: "Insufficient funds (Limit reached)",
                    balance,
                    cost,
                };
            }

            tx.update(userRef, { balance: FieldValue.increment(-cost) });
            tx.set(sessionRef, {
                userId,
                vehicleId,
                vehiclePlate,
                zone,
                address,
                startTime,
                endTime,
                cost,
                costPerHour,
                status: "active",
            });

            return { sessionId: sessionRef.id, newBalance: balance - cost };
        });

        return NextResponse.json({
            success: true,
            sessionId: result.sessionId,
            newBalance: result.newBalance,
        });
    } catch (error: any) {
        if (error?.code === "USER_NOT_FOUND") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error?.code === "INSUFFICIENT_FUNDS") {
            return NextResponse.json(
                {
                    error: error.message,
                    code: "INSUFFICIENT_FUNDS",
                    balance: error.balance,
                    cost: error.cost,
                },
                { status: 409 }
            );
        }
        console.error("startParking error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal error" },
            { status: 500 }
        );
    }
}
