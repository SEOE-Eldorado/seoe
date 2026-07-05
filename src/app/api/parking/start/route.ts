import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

const startParkingSchema = z.object({
  vehicleId: z.string().min(1),
  zone: z.string().min(1),
  address: z.string().min(1),
  hours: z.number().int().min(1).max(24),
  costPerHour: z.number().positive(),
  vehiclePlate: z.string().min(1).max(10),
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

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balance = userDoc.data()?.balance || 0;
    if (balance - cost < -200) {
      return NextResponse.json({ error: "Insufficient funds (Limit reached)" }, { status: 400 });
    }

    const startTime = new Date();
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    await userRef.update({ balance: balance - cost });
    await sessionRef.set({
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

    return NextResponse.json({ success: true, sessionId: sessionRef.id });
  } catch (error: any) {
    console.error("startParking error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
