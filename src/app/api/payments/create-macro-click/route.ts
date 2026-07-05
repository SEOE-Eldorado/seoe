import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { encryptString } from "pluspagos-aes-encryption";

const MACRO_CLICK_COMMERCE_ID = "303b9879-0ac6-49ae-802a-b665c696725b";
const MACRO_CLICK_SECRET_KEY = "MUNICIPALIDADDEELDORADOSEO_dad354f2-ab69-403c-add4-817ab175fe97";
const IS_SANDBOX = true;
const BASE_URL = IS_SANDBOX
  ? "https://sandboxpp.asjservicios.com.ar"
  : "https://botonpp.asjservicios.com.ar";

interface MacroClickPaymentRequest {
  amount: number;
}

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

    const body = await request.json();
    const { amount } = body as MacroClickPaymentRequest;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    // 1. Create Internal Pending Record
    const paymentRef = adminDb.collection("payments").doc();
    const transactionId = paymentRef.id;

    await paymentRef.set({
      userId: decodedToken.uid,
      amount,
      status: "pending",
      createdAt: new Date(),
      gateway: "macro_click",
      transactionId,
      description: "Recarga de Saldo",
    });

    // 2. Format Data
    const amountStr = (amount * 100).toFixed(0);
    const commerceId = MACRO_CLICK_COMMERCE_ID;
    const secretKey = MACRO_CLICK_SECRET_KEY;
    const branchId = "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 3. Callback URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const callbackSuccess = `${origin}/payment/callback?status=success&payment_id=${transactionId}`;
    const callbackCancel = `${origin}/payment/callback?status=cancel&payment_id=${transactionId}`;

    // 4. Encrypt
    let encMonto, encSuccess, encCancel, encBranch;
    try {
      encMonto = encryptString(amountStr, secretKey);
      encSuccess = encryptString(callbackSuccess, secretKey);
      encCancel = encryptString(callbackCancel, secretKey);
      encBranch = encryptString("", secretKey);
    } catch (e) {
      console.error("Encryption error", e);
      return NextResponse.json({ error: "Error encriptando datos de pago" }, { status: 500 });
    }

    // 5. Hash
    const hashString = `${ip}${secretKey}${commerceId}${branchId}${amountStr}`;
    const hash = crypto.createHash("sha256").update(hashString).digest("hex");

    const fields: Record<string, string> = {
      CallbackSuccess: encSuccess,
      CallbackCancel: encCancel,
      Comercio: commerceId,
      SucursalComercio: encBranch,
      TransaccionComercioId: transactionId,
      Monto: encMonto,
      Hash: hash,
      "Producto[0]": "Recarga de Saldo",
      "MontoProducto[0]": amountStr,
    };

    return NextResponse.json({
      url: BASE_URL,
      fields,
      paymentId: transactionId,
    });
  } catch (error: any) {
    console.error("createMacroClickPayment error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
