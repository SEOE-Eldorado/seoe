import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const payFineSchema = z.object({
    fineId: z.string().min(1),
});

/**
 * POST /api/fines/pay
 *
 * FIX bug 0.7 (race condition): la versión original hacía `userRef.update({ balance: balance - amount })`
 * y `fineRef.update({ status: "paid" })` sin transacción. Dos requests concurrentes
 * podían pagar el mismo fine dos veces (debitar el saldo dos veces).
 *
 * Ahora: transacción atómica — verifica el estado, valida saldo, debita y marca como paid.
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
        const data = payFineSchema.safeParse(body);

        if (!data.success) {
            return NextResponse.json(
                { error: `Invalid request: ${data.error.errors.map(e => e.message).join(", ")}` },
                { status: 400 }
            );
        }

        const { fineId } = data.data;
        const fineRef = adminDb.collection("fines").doc(fineId);
        const userRef = adminDb.collection("users").doc(userId);

        const result = await adminDb.runTransaction(async (tx) => {
            const fineDoc = await tx.get(fineRef);
            if (!fineDoc.exists) {
                throw { code: "FINE_NOT_FOUND", message: "Fine not found" };
            }
            const fineData = fineDoc.data()!;
            if (fineData.userId !== userId) {
                throw { code: "FORBIDDEN", message: "Not your fine" };
            }
            if (fineData.status !== "pending") {
                throw {
                    code: "ALREADY_PAID",
                    message: `Fine is already ${fineData.status}`,
                    status: fineData.status,
                };
            }

            const userDoc = await tx.get(userRef);
            if (!userDoc.exists) {
                throw { code: "USER_NOT_FOUND", message: "User not found" };
            }
            const balance = userDoc.data()?.balance || 0;
            const amount = fineData.amount;

            if (balance < amount) {
                throw {
                    code: "INSUFFICIENT_FUNDS",
                    message: "Insufficient funds",
                    balance,
                    amount,
                };
            }

            tx.update(userRef, { balance: FieldValue.increment(-amount) });
            tx.update(fineRef, {
                status: "paid",
                paidAt: Timestamp.now(),
            });

            return { newBalance: balance - amount };
        });

        return NextResponse.json({
            success: true,
            newBalance: result.newBalance,
        });
    } catch (error: any) {
        const code = error?.code;
        if (code === "FINE_NOT_FOUND" || code === "USER_NOT_FOUND") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (code === "FORBIDDEN") {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (code === "ALREADY_PAID") {
            return NextResponse.json(
                { error: error.message, code, status: error.status },
                { status: 409 }
            );
        }
        if (code === "INSUFFICIENT_FUNDS") {
            return NextResponse.json(
                {
                    error: error.message,
                    code,
                    balance: error.balance,
                    amount: error.amount,
                },
                { status: 409 }
            );
        }
        console.error("payFine error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal error" },
            { status: 500 }
        );
    }
}
