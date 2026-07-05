import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

const payFineSchema = z.object({
  fineId: z.string().min(1),
});

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

    const fineDoc = await fineRef.get();
    if (!fineDoc.exists) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }
    if (fineDoc.data()?.status !== "pending") {
      return NextResponse.json({ error: "Fine not pending" }, { status: 400 });
    }

    const userDoc = await userRef.get();
    const amount = fineDoc.data()?.amount;
    const balance = userDoc.data()?.balance || 0;

    if (balance < amount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    await userRef.update({ balance: balance - amount });
    await fineRef.update({ status: "paid", paidAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("payFine error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
