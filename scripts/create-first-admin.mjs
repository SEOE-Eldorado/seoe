#!/usr/bin/env node
/**
 * Script ONE-TIME para crear el primer administrador del sistema.
 *
 * ⚠️ NO usar este script si ya hay un admin en el sistema.
 *   Usar `scripts/set-role.mjs` para promover usuarios adicionales.
 *
 * Prerequisitos:
 *   - Firebase CLI instalado: npm install -g firebase-tools
 *   - Login con: firebase login
 *   - Service account con rol "Firebase Admin" o "Owner"
 *   - El usuario ya debe estar REGISTRADO en la app (Firebase Auth)
 *
 * Uso:
 *   node scripts/create-first-admin.mjs <email>
 *
 *   Ejemplo:
 *     node scripts/create-first-admin.mjs admin@seoe.eldorado.gob.ar
 *
 * ⚠️ El script va a pedir confirmación antes de aplicar cambios.
 */

import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import readline from "readline"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const email = process.argv[2]
if (!email) {
  console.error("❌ Error: debés pasar un email como argumento.")
  console.error("   Uso: node scripts/create-first-admin.mjs <email>")
  console.error("   Ej:  node scripts/create-first-admin.mjs admin@seoe.eldorado.gob.ar")
  process.exit(1)
}

// Buscar service account JSON
const serviceAccountPaths = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(__dirname, "..", "service-account.json"),
  path.join(__dirname, "..", "seoe-firebase-adminsdk.json"),
  path.join(__dirname, "..", "firebase-adminsdk.json"),
].filter(Boolean)

let serviceAccountPath = null
for (const p of serviceAccountPaths) {
  if (p && existsSync(p)) {
    serviceAccountPath = p
    break
  }
}

if (!serviceAccountPath) {
  console.error("❌ No se encontró service account JSON.")
  console.error("   Buscado en:")
  for (const p of serviceAccountPaths) {
    console.error("     - " + p)
  }
  console.error("")
  console.error("   Soluciones:")
  console.error("   1. Descargá la service account key desde Firebase Console")
  console.error("      Project Settings → Service Accounts → Generate new private key")
  console.error("   2. Guardala en scripts/service-account.json (NO COMMITEAR)")
  console.error("   3. O exportá GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/archivo.json")
  process.exit(1)
}

console.log(`🔑 Service account: ${serviceAccountPath}`)
console.log(`📧 Email a promover: ${email}`)
console.log("")

// Confirmar
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const answer = await new Promise(resolve => {
  rl.question("⚠️  ¿Confirmás que querés promover este usuario a admin? (sí/no): ", resolve)
})
rl.close()

if (answer.toLowerCase() !== "si" && answer.toLowerCase() !== "sí" && answer.toLowerCase() !== "s" && answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
  console.log("❌ Cancelado por el usuario.")
  process.exit(0)
}

// Importar firebase-admin dinámicamente (para mejor mensaje de error si no está)
let admin
try {
  admin = (await import("firebase-admin")).default
} catch (e) {
  console.error("❌ firebase-admin no está instalado.")
  console.error("   Corré: npm install firebase-admin")
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(readFileSync(serviceAccountPath, "utf8"))),
  })
}
const auth = admin.auth()
const db = admin.firestore()

try {
  // 1. Verificar que NO haya ya un admin
  const existingAdmins = await db
    .collection("users")
    .where("role", "==", "admin")
    .limit(1)
    .get()

  if (!existingAdmins.empty) {
    console.error("")
    console.error("❌ Ya existe un admin en el sistema. Abortando.")
    console.error("   Usá scripts/set-role.mjs <email> admin para promover usuarios adicionales.")
    process.exit(1)
  }

  // 2. Buscar usuario en Firebase Auth
  let userRecord
  try {
    userRecord = await auth.getUserByEmail(email)
  } catch (authError) {
    if (authError.code === "auth/user-not-found") {
      console.error("")
      console.error(`❌ No existe un usuario con email ${email} en Firebase Auth.`)
      console.error("   Pasos a seguir:")
      console.error("   1. Registrate primero en la app web/móvil con ese email")
      console.error("   2. Volvé a correr este script")
      process.exit(1)
    }
    throw authError
  }

  const uid = userRecord.uid
  console.log(`✓ Usuario encontrado en Auth: ${uid}`)

  // 3. Set custom claim (para que las Firestore rules lo reconozcan)
  await auth.setCustomUserClaims(uid, { role: "admin" })
  console.log(`✓ Custom claim 'admin' asignado a ${email}`)

  // 4. Actualizar/crear perfil en Firestore
  const userRef = db.collection("users").doc(uid)
  const userDoc = await userRef.get()

  if (!userDoc.exists) {
    await userRef.set({
      name: userRecord.displayName || email.split("@")[0],
      email: email,
      phone: userRecord.phoneNumber || "",
      role: "admin",
      balance: 0,
      autoPayFines: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`✓ Perfil admin creado en Firestore`)
  } else {
    await userRef.update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`✓ Perfil existente actualizado a admin`)
  }

  console.log("")
  console.log("✅ Listo. El usuario es ahora admin del sistema.")
  console.log("   Para verificar:")
  console.log(`     firebase firestore:get users/${uid}`)
  console.log("")
  console.log("⚠️  IMPORTANTE: hacé logout/login en la app para que el custom claim tome efecto.")
} catch (err) {
  console.error("❌ Error:", err.message)
  process.exit(1)
}
