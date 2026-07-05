import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

const endParkingSchema = z.object({
  sessionId: z.string().min(1),
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
    const data = endParkingSchema.safeParse(body);

    if (!data.success) {
      return NextResponse.json(
        { error: `Invalid request: ${data.error.errors.map(e => e.message).join(", ")}` },
        { status: 400 }
      );
    }

    const { sessionId } = data.data;
    const sessionRef = adminDb.collection("parking_sessions").doc(sessionId);

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (sessionDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: "Not your session" }, { status: 403 });
    }

    await sessionRef.update({ status: "completed" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("endParking error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
