import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

const extendParkingSchema = z.object({
  sessionId: z.string().min(1),
  additionalHours: z.number().int().min(1).max(12),
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

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (sessionDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: "Not your session" }, { status: 403 });
    }
    if (sessionDoc.data()?.status !== "active") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }

    const userDoc = await userRef.get();
    const costPerHour = sessionDoc.data()?.costPerHour;
    const additionalCost = additionalHours * costPerHour;
    const balance = userDoc.data()?.balance || 0;

    if (balance - additionalCost < -200) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    const currentEndTime = sessionDoc.data()?.endTime?.toDate();
    if (!currentEndTime) {
      return NextResponse.json({ error: "Invalid session endTime" }, { status: 400 });
    }
    const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000);

    await userRef.update({ balance: balance - additionalCost });
    await sessionRef.update({
      endTime: newEndTime,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("extendParking error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
