import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/setup-admin
 *
 * Endpoint ONE-TIME para promover al PRIMER admin del sistema.
 * Solo funciona cuando NO hay ningún usuario con rol "admin" en Firestore.
 * Una vez creado el primer admin, este endpoint se desactiva automáticamente.
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar si ya existe un admin
    const usersSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      return NextResponse.json(
        {
          error:
            "Ya existe un admin en el sistema. Usá las rutas de admin normales.",
          adminExists: true,
        },
        { status: 403 }
      );
    }

    // 2. Parsear body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // 3. Buscar usuario en Firebase Auth por email
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (authError: any) {
      if (authError.code === "auth/user-not-found") {
        return NextResponse.json(
          {
            error:
              `No existe un usuario registrado con el email ${email}. Registrate primero en la app.`,
          },
          { status: 404 }
        );
      }
      throw authError;
    }

    const uid = userRecord.uid;

    // 4. Actualizar/crear el perfil en Firestore con rol admin
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const adminData = {
      role: "admin",
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!userDoc.exists) {
      // Crear perfil completo si no existe
      await userRef.set({
        name: userRecord.displayName || email.split("@")[0],
        email: email,
        phone: userRecord.phoneNumber || "",
        role: "admin",
        balance: 0,
        autoPayFines: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Solo actualizar el rol
      await userRef.update(adminData);
    }

    // 5. Inicializar settings por defecto
    const settingsRef = adminDb.collection("settings").doc("general");
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      await settingsRef.set({
        systemName: "SEOE - Sistema de Estacionamiento",
        currency: "ARS",
        defaultBasePrice: 50,
        defaultPricePerHour: 80,
        maxHoursPerSession: 12,
        gracePeriodMinutes: 5,
        fineAmount: 1500,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
        businessDays: [1, 2, 3, 4, 5, 6], // lun-sáb
        setupComplete: true,
        setupBy: uid,
        setupAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} promovido a admin exitosamente`,
      uid: uid,
      settingsInitialized: !settingsDoc.exists,
    });
  } catch (error: any) {
    console.error("setup-admin error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup-admin
 *
 * Verifica si el sistema necesita un primer admin.
 */
export async function GET() {
  try {
    const usersSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "admin")
      .limit(1)
      .get();

    const hasAdmin = !usersSnapshot.empty;
    let adminEmail = null;

    if (hasAdmin) {
      const adminDoc = usersSnapshot.docs[0];
      adminEmail = adminDoc.data().email || null;
    }

    return NextResponse.json({
      needsSetup: !hasAdmin,
      hasAdmin,
      adminEmail,
    });
  } catch (error: any) {
    console.error("setup-admin status error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
