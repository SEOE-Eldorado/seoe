import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { adminDb } from "@shared/api/firebase-admin";

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();
    console.log("Macro Webhook received:", JSON.stringify(data));

    const transactionId = String(data.TransaccionComercioId || "");
    const statusId = String(data.EstadoId || "");
    const statusDesc = String(data.Estado || "");
    const platformId = String(data.TransaccionPlataformaId || "");

    if (!transactionId) {
      console.error("[Webhook] Missing TransaccionComercioId");
      return NextResponse.json({ error: "Missing TransaccionComercioId" }, { status: 400 });
    }

    const paymentRef = adminDb.collection("payments").doc(transactionId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      console.error(`[Webhook] Payment doc ${transactionId} NOT FOUND in DB.`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentData = paymentDoc.data();
    if (paymentData?.status === "completed") {
      console.log(`[Webhook] Payment ${transactionId} already completed. Ignoring.`);
      return NextResponse.json({ received: "ok" });
    }

    // Check if Success: statusId "3" or "2" or desc "REALIZADA"
    const isSuccess = statusId === "3" || statusId === "2" || statusDesc.toUpperCase() === "REALIZADA";

    if (isSuccess) {
      const userId = paymentData?.userId;
      const amountToAdd = Number(paymentData?.amount) || 0;

      // Update Payment
      await paymentRef.update({
        status: "completed",
        platformId,
        gatewayStatus: statusDesc,
        paidAt: new Date(),
        rawWebhook: data,
      });

      // Update User Balance
      if (userId) {
        const userRef = adminDb.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const currentBalance = Number(userDoc.data()?.balance) || 0;
          const newBalance = currentBalance + amountToAdd;
          await userRef.update({ balance: newBalance });

          // Create Notification
          await adminDb.collection("notifications").add({
            userId,
            type: "payment_success",
            title: "Recarga Exitosa",
            message: `Se acreditaron $${amountToAdd} a tu cuenta.`,
            date: new Date(),
            read: false,
            priority: "normal",
          });
        }
      }
    } else {
      await paymentRef.update({
        status: "failed",
        gatewayStatus: statusDesc,
        lastUpdate: new Date(),
        rawWebhook: data,
      });
    }

    return NextResponse.json({ received: "ok" });
  } catch (e) {
    console.error("[Webhook] Fatal Error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
