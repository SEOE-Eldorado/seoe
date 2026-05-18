
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
// @ts-ignore
import { encryptString } from "pluspagos-aes-encryption";

const db = admin.firestore();

// Credentials (Should be in environment variables in production)
const MACRO_CLICK_COMMERCE_ID = "303b9879-0ac6-49ae-802a-b665c696725b";
const MACRO_CLICK_SECRET_KEY = "MUNICIPALIDADDEELDORADOSEO_dad354f2-ab69-403c-add4-817ab175fe97";
const IS_SANDBOX = true;
const BASE_URL = IS_SANDBOX
    ? "https://sandboxpp.asjservicios.com.ar"
    : "https://botonpp.asjservicios.com.ar";

interface MacroClickPaymentRequest {
    amount: number;
}

interface MacroClickPaymentResponse {
    url: string;
    fields: Record<string, string>;
    paymentId: string; // Internal ID
}

export const createMacroClickPayment = onCall(async (request: CallableRequest<MacroClickPaymentRequest>): Promise<MacroClickPaymentResponse> => {
    const { amount } = request.data;

    if (!request.auth) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
    if (!amount || amount <= 0) throw new HttpsError("invalid-argument", "Monto inválido.");

    // 1. Create Internal Pending Record
    const paymentRef = db.collection('payments').doc();
    const transactionId = paymentRef.id; // Unique ID for our system and theirs

    await paymentRef.set({
        userId: request.auth.uid,
        amount: amount,
        status: 'pending', // pending, completed, failed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        gateway: 'macro_click',
        transactionId: transactionId, // TransaccionComercioId
        description: 'Recarga de Saldo'
    });

    // 2. Format Data
    const amountStr = (amount * 100).toFixed(0);
    const commerceId = MACRO_CLICK_COMMERCE_ID;
    const secretKey = MACRO_CLICK_SECRET_KEY;
    const branchId = "";
    const ip = request.rawRequest.ip || "127.0.0.1";

    // 3. Callback URLs
    const baseUrl = request.rawRequest.headers.origin || "http://localhost:3000";
    // We explicitly tell Macro Click the success/cancel URLs. 
    // We can include the paymentId in the query param if we want the client to poll it.
    const callbackSuccess = `${baseUrl}/payment/callback?status=success&payment_id=${transactionId}`;
    const callbackCancel = `${baseUrl}/payment/callback?status=cancel&payment_id=${transactionId}`;

    // 4. Encrypt
    let encMonto, encSuccess, encCancel, encBranch;
    try {
        encMonto = encryptString(amountStr, secretKey);
        encSuccess = encryptString(callbackSuccess, secretKey);
        encCancel = encryptString(callbackCancel, secretKey);
        encBranch = branchId ? encryptString(branchId, secretKey) : encryptString("", secretKey);
    } catch (e) {
        console.error("Encryption error", e);
        throw new HttpsError("internal", "Error encriptando datos de pago");
    }

    // 5. Hash
    // Formula: SHA256(ip + secretKey + commerceId + branchId + plainAmount)
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

    return {
        url: BASE_URL,
        fields: fields,
        paymentId: transactionId
    };
});

/**
 * Handle POST notifications from Macro Click.
 * This function should be configured as the Notification URL in Macro Click panel.
 */
export const handleMacroClickWebhook = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const data = req.body;
    console.log("Macro Webhook received:", JSON.stringify(data));

    // Data structure based on PDF Section 4
    // { TransaccionComercioId, Monto, Estado, EstadoId, TransaccionPlataformaId, ... }

    // Status Code 3 = REALIZADA (Success)
    // Note: Some JSONs show Int, others String. Convert to String for safety.
    const transactionId = String(data.TransaccionComercioId || "");
    const statusId = String(data.EstadoId || "");
    const statusDesc = String(data.Estado || "");
    const platformId = String(data.TransaccionPlataformaId || "");

    console.log(`[Webhook] Processing Tx: ${transactionId}, StatusId: ${statusId}, Status: ${statusDesc}`);

    if (!transactionId) {
        console.error("[Webhook] Missing TransaccionComercioId");
        res.status(400).send('Missing TransaccionComercioId');
        return;
    }

    const paymentRef = db.collection('payments').doc(transactionId);

    try {
        await db.runTransaction(async (t) => {
            const paymentDoc = await t.get(paymentRef);
            if (!paymentDoc.exists) {
                console.error(`[Webhook] Payment doc ${transactionId} NOT FOUND in DB.`);
                return;
            }

            const paymentData = paymentDoc.data();
            console.log(`[Webhook] Payment found. Current Status: ${paymentData?.status}`);

            if (paymentData?.status === 'completed') {
                console.log(`[Webhook] Payment ${transactionId} already completed. Ignoring.`);
                return;
            }

            // Check if Success
            // PDF v2.26 says "3" is REALIZADA.
            // User provided JSON says "2" is REALIZADA.
            const isSuccess = statusId === "3" || statusId === "2" || statusDesc.toUpperCase() === "REALIZADA";

            if (isSuccess) {
                // Prepare User Read explicitly BEFORE any write
                const userId = paymentData?.userId;
                let currentBalance = 0;
                let userDoc = null;
                let userRef = null;

                // READ USER (if applicable)
                if (userId) {
                    userRef = db.collection('users').doc(userId);
                    userDoc = await t.get(userRef);
                    if (userDoc.exists) {
                        currentBalance = Number(userDoc.data()?.balance) || 0;
                    } else {
                        console.error(`[Webhook] User ${userId} NOT FOUND.`);
                    }
                }

                // --- NOW WE CAN WRITE ---

                console.log(`[Webhook] Marking Payment ${transactionId} as COMPLETED.`);

                // 1. Update Payment
                t.update(paymentRef, {
                    status: 'completed',
                    platformId: platformId,
                    gatewayStatus: statusDesc,
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    rawWebhook: data
                });

                // 2. Update User Balance (if user exists)
                if (userRef && userDoc && userDoc.exists) {
                    const amountToAdd = Number(paymentData?.amount) || 0;
                    const newBalance = currentBalance + amountToAdd;

                    console.log(`[Webhook] Updating Balance User ${userId}: ${currentBalance} + ${amountToAdd} = ${newBalance}`);

                    t.update(userRef, {
                        balance: newBalance
                    });

                    // 3. Create Notification
                    const notifRef = db.collection('notifications').doc();
                    t.set(notifRef, {
                        userId: userId,
                        type: 'payment_success',
                        title: 'Recarga Exitosa',
                        message: `Se acreditaron $${amountToAdd} a tu cuenta.`,
                        date: admin.firestore.FieldValue.serverTimestamp(),
                        read: false,
                        priority: 'normal'
                    });
                }

            } else {
                console.log(`[Webhook] Payment status NOT success (${statusId}). Marking failed/pending.`);
                // Failed or pending
                t.update(paymentRef, {
                    status: 'failed',
                    gatewayStatus: statusDesc,
                    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
                    rawWebhook: data
                });
            }
        });

        res.status(200).send('OK');
    } catch (e) {
        console.error("[Webhook] Transaction Fatal Error:", e);
        res.status(500).send('Internal Server Error');
    }
});
