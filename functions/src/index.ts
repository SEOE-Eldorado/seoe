
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://233e810929a31519aa9badf1e47dccdf@o4511212511232000.ingest.us.sentry.io/4511212521914368",
  tracesSampleRate: 1.0,
});

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { z } from "zod";

// --- Validations (Zod) ---
const addBalanceSchema = z.object({
    amount: z.number().positive(),
});

const payFineSchema = z.object({
    fineId: z.string().min(1),
});

const startParkingSchema = z.object({
    vehicleId: z.string().min(1),
    zone: z.string().min(1),
    address: z.string().min(1),
    hours: z.number().int().min(1).max(24),
    costPerHour: z.number().positive(),
    vehiclePlate: z.string().min(1).max(10), // Basic length check for license plates
});

const extendParkingSchema = z.object({
    sessionId: z.string().min(1),
    additionalHours: z.number().int().min(1).max(12),
});

const endParkingSchema = z.object({
    sessionId: z.string().min(1),
});

const createAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(["admin", "inspector"]),
});

const validate = (schema: z.ZodSchema, data: any) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new HttpsError('invalid-argument', `Invalid request: ${result.error.errors.map(e => e.message).join(", ")}`);
    }
    return result.data;
};

// Ensure structured logging for GCP Cloud Logging
global.console.log = logger.info;
global.console.warn = logger.warn;
global.console.error = logger.error;


admin.initializeApp();
const db = admin.firestore();

// 1. Trigger: Auto-pay fine when created
// 1. Trigger: Auto-pay fine when created & Notify User
export const checkAndAutoPayFine = onDocumentCreated("fines/{fineId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const fineData = snapshot.data();
    let userId = fineData.userId;
    const amount = fineData.amount;
    const vehiclePlate = fineData.vehiclePlate;

    // 1. If userId is missing, try to find it via vehiclePlate
    if (!userId && vehiclePlate) {
        console.log(`Fine ${event.params.fineId} has no userId. Searching for owner of plate ${vehiclePlate}...`);
        try {
            const vehiclesSnapshot = await db.collection('vehicles')
                .where('licensePlate', '==', vehiclePlate)
                .limit(1)
                .get();

            if (!vehiclesSnapshot.empty) {
                const vehicleData = vehiclesSnapshot.docs[0].data();
                userId = vehicleData.userId;
                console.log(`Found owner ${userId} for plate ${vehiclePlate}. Updating fine.`);

                // Link fine to user
                await snapshot.ref.update({ userId: userId });
            } else {
                console.log(`No vehicle found for plate ${vehiclePlate}`);
            }
        } catch (error) {
            console.error("Error searching for vehicle owner:", error);
        }
    }

    if (!userId) {
        console.log(`Could not identify user for fine ${event.params.fineId}. Skipping notification and auto-pay.`);
        return;
    }

    // 2. Send Notification to User
    try {
        const notifId = `fine_new_${event.params.fineId}`;
        await db.collection('notifications').doc(notifId).set({
            userId: userId,
            type: 'fine_received',
            title: 'Nueva Infracción',
            message: `Se ha generado una nueva infracción para el vehículo ${vehiclePlate || ''}. Monto: $${amount}`,
            date: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
            priority: 'high',
            actionUrl: '/fines',
            relatedId: event.params.fineId
        });
        console.log(`Notification sent to user ${userId} for fine ${event.params.fineId}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }

    // 3. Auto-pay logic
    if (!amount) return;

    const userRef = db.collection('users').doc(userId);
    const fineRef = snapshot.ref;

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return; // User not found

            const userData = userDoc.data();
            if (userData?.autoPayFines === true) {
                const currentBalance = userData.balance || 0;
                if (currentBalance >= amount) {
                    // Execute auto-payment
                    transaction.update(userRef, { balance: currentBalance - amount });
                    transaction.update(fineRef, {
                        status: 'paid',
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                        autoPaid: true
                    });
                    console.log(`Auto-paid fine ${event.params.fineId} for user ${userId}`);
                } else {
                    console.log(`Insufficient balance for auto-pay for user ${userId}`);
                }
            }
        });
    } catch (error) {
        console.error("Error in auto-pay transaction", error);
    }
});


export const addBalance = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { amount } = validate(addBalanceSchema, request.data);
    const userId = request.auth.uid;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new HttpsError('not-found', 'User not found');
        const newBalance = (userDoc.data()?.balance || 0) + amount;
        transaction.update(userRef, { balance: newBalance });
    });
    return { success: true };
});

export const payFine = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { fineId } = validate(payFineSchema, request.data);
    const userId = request.auth.uid;
    const fineRef = db.collection('fines').doc(fineId);
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
        const fineDoc = await transaction.get(fineRef);
        const userDoc = await transaction.get(userRef);

        if (!fineDoc.exists) throw new HttpsError('not-found', 'Fine not found');
        if (fineDoc.data()?.status !== 'pending') throw new HttpsError('failed-precondition', 'Fine not pending');

        const amount = fineDoc.data()?.amount;
        const balance = userDoc.data()?.balance || 0;

        if (balance < amount) throw new HttpsError('failed-precondition', 'Insufficient funds');

        transaction.update(userRef, { balance: balance - amount });
        transaction.update(fineRef, { status: 'paid', paidAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { success: true };
});

export const startParking = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { vehicleId, zone, address, hours, costPerHour, vehiclePlate } = validate(startParkingSchema, request.data);
    const userId = request.auth.uid;
    const cost = hours * costPerHour;

    const userRef = db.collection('users').doc(userId);
    const sessionRef = db.collection('parking_sessions').doc(); // Auto ID

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new HttpsError('not-found', 'User not found');

        const balance = userDoc.data()?.balance || 0;
        // Check minimum balance limit if needed, e.g. -200
        if (balance - cost < -200) throw new HttpsError('failed-precondition', 'Insufficient funds (Limit reached)');

        transaction.update(userRef, { balance: balance - cost });

        // Create session
        const startTime = admin.firestore.Timestamp.now();
        const endTime = admin.firestore.Timestamp.fromMillis(Date.now() + (hours * 60 * 60 * 1000));

        transaction.set(sessionRef, {
            userId,
            vehicleId,
            vehiclePlate,
            zone,
            address,
            startTime,
            endTime,
            cost,
            costPerHour,
            status: 'active'
        });
    });
    return { success: true, sessionId: sessionRef.id };
});

export const extendParking = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { sessionId, additionalHours } = validate(extendParkingSchema, request.data);
    const userId = request.auth.uid;

    const sessionRef = db.collection('parking_sessions').doc(sessionId);
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        const userDoc = await transaction.get(userRef);

        if (!sessionDoc.exists) throw new HttpsError('not-found', 'Session not found');
        if (sessionDoc.data()?.userId !== userId) throw new HttpsError('permission-denied', 'Not your session');
        if (sessionDoc.data()?.status !== 'active') throw new HttpsError('failed-precondition', 'Session not active');

        const costPerHour = sessionDoc.data()?.costPerHour;
        const additionalCost = additionalHours * costPerHour;
        const balance = userDoc.data()?.balance || 0;

        if (balance - additionalCost < -200) throw new HttpsError('failed-precondition', 'Insufficient funds');

        const currentEndTime = sessionDoc.data()?.endTime.toDate();
        const newEndTime = admin.firestore.Timestamp.fromMillis(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000));

        transaction.update(userRef, { balance: balance - additionalCost });
        transaction.update(sessionRef, {
            endTime: newEndTime,
            cost: admin.firestore.FieldValue.increment(additionalCost)
        });
    });
    return { success: true };
});

export const endParking = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    const { sessionId } = validate(endParkingSchema, request.data);
    const sessionRef = db.collection('parking_sessions').doc(sessionId);

    await sessionRef.update({ status: 'completed' });
    return { success: true };
});

export const createAdminUserV1 = onCall({
    maxInstances: 10,
    cors: true
}, async (request) => {
    // 1. Check if caller is admin
    if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required');
    
    const callerRef = db.collection('users').doc(request.auth.uid);
    const callerDoc = await callerRef.get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can create other admins/inspectors');
    }

    // 2. Validate input
    const { email, password, name, role } = validate(createAdminSchema, request.data);

    try {
        // 3. Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 4. Create Firestore Profile
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            balance: 0,
            autoPayFines: false
        });

        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error creating admin user:", error);
        throw new HttpsError('internal', error.message || 'Failed to create user');
    }
});

// Run every 1 minute to check for expiring/expired sessions with precision
export const checkParkingExpirations = onSchedule("every 1 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const nowMillis = now.toMillis();
    const fifteenMinutesLater = admin.firestore.Timestamp.fromMillis(nowMillis + 15 * 60 * 1000);

    const snapshot = await db.collection('parking_sessions')
        .where('status', '==', 'active')
        .where('endTime', '<=', fifteenMinutesLater)
        .get();

    if (snapshot.empty) {
        console.log("No sessions expiring soon.");
        return;
    }

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const endTimeMillis = data.endTime.toMillis();
        const diffMillis = endTimeMillis - nowMillis;
        const diffMinutes = Math.floor(diffMillis / (1000 * 60));

        // Case A: Time Ended -> Auto-Complete Session
        if (diffMinutes <= 0) {
            // Automatically close the session as completed essentially triggers 'parking ended naturally'
            // Use 'completed' to signify normal end, or if 'expired' implies strictly Overtime Penalty,
            // the user request suggests "finalizar de forma automatica", which sounds like a neutral close.
            batch.update(doc.ref, { status: 'completed' });

            const notifId = `completed_${doc.id}`;
            const notifRef = db.collection('notifications').doc(notifId);

            batch.set(notifRef, {
                userId: data.userId,
                type: 'parking_expired', // Keep type for UI icon handling or change to 'system'
                title: 'Estacionamiento Finalizado',
                message: `Tu tiempo de estacionamiento ha finalizado y la sesión se ha cerrado automáticamente.`,
                date: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                priority: 'medium', // Downgrade priority since it's auto-resolved? Or keep high for awareness?
                actionUrl: '/history'
            });
            batchCount++;
        }
        // Case B: Expiring Very Soon (5 mins)
        else if (diffMinutes <= 5 && diffMinutes > 0) {
            if (!data.warned_5m) {
                const notifId = `warn_5m_${doc.id}`;
                const notifRef = db.collection('notifications').doc(notifId);

                batch.update(doc.ref, { warned_5m: true });
                batch.set(notifRef, {
                    userId: data.userId,
                    type: 'parking_expiring',
                    title: '¡5 minutos restantes!',
                    message: `Tu estacionamiento finaliza en 5 minutos. Extiende ahora para evitar infracciones.`,
                    date: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                    priority: 'urgent',
                    actionUrl: '/activeParking'
                });
                batchCount++;
            }
        }
        // Case C: Expiring Soon (10 mins)
        else if (diffMinutes <= 10 && diffMinutes > 5) {
            if (!data.warned_10m) {
                const notifId = `warn_10m_${doc.id}`;
                const notifRef = db.collection('notifications').doc(notifId);

                batch.update(doc.ref, { warned_10m: true });
                batch.set(notifRef, {
                    userId: data.userId,
                    type: 'parking_expiring',
                    title: 'Tu estacionamiento vence pronto',
                    message: `Quedan ${diffMinutes} minutos de estacionamiento.`,
                    date: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                    priority: 'high',
                    actionUrl: '/activeParking'
                });
                batchCount++;
            }
        }
    }

    if (batchCount > 0) {
        await batch.commit();
        console.log(`Processed ${batchCount} expiring/expired sessions.`);
    }
});

// Helper for Notification Distribution
async function distributeNotification(docSnapshot: admin.firestore.DocumentSnapshot) {
    const data = docSnapshot.data();
    if (!data) return;

    const { title, body, targetType, targetId, priority } = data;

    let targetUsers: string[] = [];

    try {
        if (targetType === 'all') {
            const usersSnap = await db.collection('users').get();
            targetUsers = usersSnap.docs.map(d => d.id);
        } else if (targetType === 'debtors') {
            const usersSnap = await db.collection('users').where('balance', '<', 0).get();
            targetUsers = usersSnap.docs.map(d => d.id);
        } else if (targetType === 'zone') {
            // Find active sessions in zone to identify users
            const sessionsSnap = await db.collection('parking_sessions')
                .where('zone', '==', targetId) // Note: field checks might need adjustment based on schema
                .where('status', '==', 'active')
                .get();
            targetUsers = [...new Set(sessionsSnap.docs.map(d => d.data().userId))];
        }

        if (targetUsers.length === 0) {
            await docSnapshot.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), sentCount: 0, note: "No recipients found" });
            return;
        }

        const batches = [];
        let batch = db.batch();
        let count = 0;

        for (const userId of targetUsers) {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                userId,
                title,
                message: body,
                date: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                priority: priority || 'normal',
                type: 'system_announcement',
                actionUrl: '/notifications'
            });
            count++;
            if (count >= 400) {
                batches.push(batch.commit());
                batch = db.batch();
                count = 0;
            }
        }
        if (count > 0) batches.push(batch.commit());

        await Promise.all(batches);

        // Update Queue Item
        await docSnapshot.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp(), sentCount: targetUsers.length });

    } catch (error) {
        console.error("Error distributing notifications:", error);
        await docSnapshot.ref.update({ status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}

// 7. Notificaciones Push (Cola)
export const processNotificationsQueue = onDocumentCreated("notifications_queue/{notificationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const notifData = snapshot.data();

    // Si es futura, ignorar (el cron se encarga)
    const now = admin.firestore.Timestamp.now();
    if (notifData.scheduledFor && notifData.scheduledFor.toMillis() > now.toMillis() + 60000) {
        return;
    }

    await distributeNotification(snapshot);
});

// 7b. Cron para Notificaciones Programadas
export const processScheduledNotifications = onSchedule("every 5 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const query = db.collection('notifications_queue')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', now);

    const snapshot = await query.get();
    for (const doc of snapshot.docs) {
        await distributeNotification(doc);
    }
});

// 9. Transacciones y Balances
export const onTransactionCreated = onDocumentCreated("transactions/{txId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const tx = snapshot.data();

    // Procesar solo validas y no procesadas
    if (tx.status === 'completed' && !tx.processed) {
        const userRef = db.collection('users').doc(tx.userId);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) return;

            const currentBalance = userDoc.data()?.balance || 0;
            let newBalance = currentBalance;

            if (tx.type === 'credit') {
                newBalance += tx.amount;
            } else if (tx.type === 'debit') {
                newBalance -= tx.amount;
            }

            t.update(userRef, { balance: newBalance });
            t.update(snapshot.ref, { processed: true, processedAt: admin.firestore.FieldValue.serverTimestamp() });
        });
    }
});

// 9b. Reembolsos
export const onTransactionUpdated = onDocumentUpdated("transactions/{txId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Status cambiado a 'refunded'
    if (before.status !== 'refunded' && after.status === 'refunded') {
        const userRef = db.collection('users').doc(after.userId);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) return;

            const currentBalance = userDoc.data()?.balance || 0;

            // Revertir
            if (after.type === 'credit') {
                // Si le dimos crédito, se lo quitamos
                t.update(userRef, { balance: currentBalance - after.amount });
            } else if (after.type === 'debit') {
                // Si le cobramos, se lo devolvemos
                t.update(userRef, { balance: currentBalance + after.amount });
            }
        });
    }
});

// --- FCM Push Notifications ---

/**
 * When a notification document is created in the `notifications` collection,
 * send an FCM push message to all of the user's registered devices.
 */
export const onNotificationCreated = onDocumentCreated("notifications/{notificationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const notifData = snapshot.data();
    const userId = notifData.userId;

    if (!userId) {
        console.log(`[FCM] No userId on notification ${event.params.notificationId}, skipping push.`);
        return;
    }

    try {
        // Get user's FCM tokens
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.log(`[FCM] User ${userId} not found, skipping push.`);
            return;
        }

        const userData = userDoc.data();
        const fcmTokens: string[] = userData?.fcmTokens || [];

        if (fcmTokens.length === 0) {
            console.log(`[FCM] No FCM tokens for user ${userId}, skipping push.`);
            return;
        }

        const title = notifData.title || 'SEOE';
        const body = notifData.message || '';
        const actionUrl = notifData.actionUrl || '/notifications';
        const notificationType = notifData.type || 'general';
        const priority = notifData.priority === 'urgent' ? 'high' : 'normal';

        const payload: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body,
            },
            data: {
                url: actionUrl,
                type: notificationType,
                notificationId: event.params.notificationId,
            },
            android: {
                priority: priority as 'high' | 'normal',
                notification: {
                    channelId: 'seoe_notifications',
                    priority: priority === 'high' ? 'high' : 'default',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        alert: { title, body },
                    },
                },
            },
            webpush: {
                notification: {
                    title,
                    body,
                    icon: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                },
                fcmOptions: {
                    link: actionUrl,
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`[FCM] Sent to ${response.successCount} devices, ${response.failureCount} failures`);

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && 
                    (resp.error?.code === 'messaging/invalid-registration-token' ||
                     resp.error?.code === 'messaging/registration-token-not-registered' ||
                     resp.error?.code === 'messaging/unregistered')) {
                    invalidTokens.push(fcmTokens[idx]);
                }
            });

            if (invalidTokens.length > 0) {
                console.log(`[FCM] Removing ${invalidTokens.length} invalid tokens for user ${userId}`);
                await db.collection('users').doc(userId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
                });
            }
        }
    } catch (error) {
        console.error(`[FCM] Error sending push for notification ${event.params.notificationId}:`, error);
    }
});

export * from './macro-click';
