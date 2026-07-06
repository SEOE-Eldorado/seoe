import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@shared/api/firebase-admin";

const createSellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación de admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden crear vendedores" }, { status: 403 });
    }

    // 2. Validar body
    const body = await request.json();
    const data = createSellerSchema.safeParse(body);
    if (!data.success) {
      return NextResponse.json(
        { error: `Datos inválidos: ${data.error.errors.map(e => e.message).join(", ")}` },
        { status: 400 }
      );
    }

    const { email, password, name } = data.data;

    // 3. Crear usuario en Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 4. Crear perfil en Firestore con rol seller
    await adminDb.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: "seller",
      balance: 0,
      autoPayFines: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decodedToken.uid,
      active: true,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: `Vendedor ${name} creado exitosamente`,
    });
  } catch (error: any) {
    console.error("create seller error:", error);
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
