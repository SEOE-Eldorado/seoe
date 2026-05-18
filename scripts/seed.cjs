/**
 * Seed script: genera 1000 usuarios + 7 inspectores + datos de prueba
 *
 * Uso:
 *   1. Configurar GOOGLE_APPLICATION_CREDENTIALS o hacer firebase login
 *   2. node scripts/seed.cjs [--emulator] [--count=1000]
 *
 *   --emulator   : apunta a Firebase Emulators (localhost)
 *   --count=N    : cantidad de usuarios a crear (default: 1000)
 */

const admin = require("firebase-admin");
const crypto = require("crypto");

// --- Config ---
const args = process.argv.slice(2);
const USE_EMULATOR = args.includes("--emulator");
const USER_COUNT = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "1000", 10);
const INSPECTOR_COUNT = 7;

const ZONES = [
  { name: "Microcentro", basePrice: 80, pricePerHour: 120 },
  { name: "Centro", basePrice: 60, pricePerHour: 100 },
  { name: "Terminal", basePrice: 50, pricePerHour: 80 },
  { name: "Hospital", basePrice: 40, pricePerHour: 70 },
  { name: "Costanera", basePrice: 30, pricePerHour: 60 },
  { name: "Barrio Norte", basePrice: 25, pricePerHour: 50 },
  { name: "Zona Sur", basePrice: 20, pricePerHour: 40 },
  { name: "Zona Este", basePrice: 20, pricePerHour: 40 },
];

const VEHICLE_BRANDS = ["Toyota", "Ford", "Volkswagen", "Chevrolet", "Fiat", "Renault", "Peugeot", "Honda", "Nissan", "Hyundai"];
const VEHICLE_MODELS = ["Etios", "Focus", "Gol", "Onix", "Cronos", "Sandero", "208", "Civic", "Versa", "Creta"];
const VEHICLE_COLORS = ["Blanco", "Negro", "Gris", "Rojo", "Azul", "Plateado", "Verde", "Marrón", "Naranja", "Borravino"];

// --- Firebase Init ---
if (USE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
}

if (admin.apps.length === 0) {
  if (USE_EMULATOR) {
    admin.initializeApp({ projectId: "seoe-67101" });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

// --- Helpers ---
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generatePlate() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // Modern format: AB123CD
  return `${pick(letters)}${pick(letters)}${randomInt(100, 999)}${pick(letters)}${pick(letters)}`;
}

function generatePhone() {
  const prefixes = ["11", "15", "351", "341", "261", "223", "381", "387", "343", "362"];
  const prefix = pick(prefixes);
  const number = String(randomInt(1000000, 9999999));
  return `+54${prefix}${number}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---
async function main() {
  console.log(`🚀 Iniciando seed para ${USER_COUNT} usuarios + ${INSPECTOR_COUNT} inspectores`);
  console.log(`   Modo: ${USE_EMULATOR ? "📦 Emuladores" : "☁️  Producción"}`);
  console.log("");

  // 1. Seed zones
  console.log("🏙️  Creando zonas...");
  const zoneBatch = db.batch();
  for (const zone of ZONES) {
    const ref = db.collection("zones").doc(zone.name.toLowerCase().replace(/\s/g, "_"));
    zoneBatch.set(ref, {
      ...zone,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await zoneBatch.commit();
  console.log(`   ✅ ${ZONES.length} zonas creadas`);

  // 2. Seed admin
  console.log("\n👤 Creando admin...");
  try {
    const adminUser = await auth.createUser({
      email: "admin@seoe.com",
      password: "admin123456",
      displayName: "Administrador",
    });
    await db.collection("users").doc(adminUser.uid).set({
      name: "Administrador",
      email: "admin@seoe.com",
      phone: "+5491100000000",
      balance: 999999,
      role: "admin",
      autoPayFines: false,
      fcmTokens: [],
      preferences: { pushEnabled: true, reminderTime: 10 },
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`   ✅ Admin creado: admin@seoe.com / admin123456`);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log(`   ⏭️  Admin ya existe`);
    } else {
      console.error(`   ❌ Error creando admin:`, err.message);
    }
  }

  // 3. Seed inspectors
  console.log(`\n🔍 Creando ${INSPECTOR_COUNT} inspectores...`);
  let inspectorIds = [];
  for (let i = 1; i <= INSPECTOR_COUNT; i++) {
    const email = `inspector${i}@seoe.com`;
    try {
      const inspector = await auth.createUser({
        email,
        password: "inspector123",
        displayName: `Inspector ${i}`,
      });
      await db.collection("users").doc(inspector.uid).set({
        name: `Inspector ${i}`,
        email,
        phone: generatePhone(),
        balance: 0,
        role: "inspector",
        autoPayFines: false,
        fcmTokens: [],
        preferences: { pushEnabled: true, reminderTime: 10 },
        zone: pick(ZONES).name,
        createdAt: FieldValue.serverTimestamp(),
      });
      inspectorIds.push(inspector.uid);
      console.log(`   ✅ Inspector ${i}: ${email} / inspector123`);
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        console.log(`   ⏭️  Inspector ${i} ya existe`);
        // Try to get existing
        const userRecord = await auth.getUserByEmail(email);
        inspectorIds.push(userRecord.uid);
      }
    }
  }

  // 4. Seed regular users
  console.log(`\n👥 Creando ${USER_COUNT} usuarios...`);
  let userRecords = [];
  const BATCH_SIZE = 50;
  const AUTH_BATCH_SIZE = 10; // Auth API rate limit

  for (let i = 1; i <= USER_COUNT; i++) {
    const email = `user${i}@seoe.com`;
    const name = `Usuario ${i}`;
    const phone = generatePhone();
    const password = "usuario123";

    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      userRecords.push({ uid: userRecord.uid, email, name, phone });
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        // Fetch existing
        try {
          const existing = await auth.getUserByEmail(email);
          userRecords.push({ uid: existing.uid, email, name, phone });
        } catch {}
      } else {
        console.error(`   ❌ Error user ${i}: ${err.message}`);
      }
    }

    // Batch create Firestore documents
    if (userRecords.length % BATCH_SIZE === 0 || i === USER_COUNT) {
      const batch = db.batch();
      for (const rec of userRecords.slice(-BATCH_SIZE)) {
        const ref = db.collection("users").doc(rec.uid);
        batch.set(ref, {
          name: rec.name,
          email: rec.email,
          phone: rec.phone,
          balance: randomInt(0, 5000),
          role: "user",
          autoPayFines: Math.random() < 0.3, // 30% have auto-pay
          fcmTokens: [],
          preferences: { pushEnabled: true, reminderTime: pick([5, 10, 15]) },
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    // Rate limit auth creation
    if (i % AUTH_BATCH_SIZE === 0) {
      const pct = Math.round((i / USER_COUNT) * 100);
      process.stdout.write(`\r   Progreso: ${i}/${USER_COUNT} (${pct}%)`);
      await delay(100);
    }
  }
  console.log(`\n   ✅ ${userRecords.length} usuarios creados`);

  // 5. Seed vehicles (1-3 per user)
  console.log("\n🚗 Creando vehículos...");
  let vehicleCount = 0;
  for (let i = 0; i < userRecords.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = userRecords.slice(i, i + BATCH_SIZE);

    for (const user of chunk) {
      const vehicleCountForUser = randomInt(1, 3);
      for (let v = 0; v < vehicleCountForUser; v++) {
        const ref = db.collection("vehicles").doc();
        batch.set(ref, {
          userId: user.uid,
          licensePlate: generatePlate(),
          brand: pick(VEHICLE_BRANDS),
          model: pick(VEHICLE_MODELS),
          color: pick(VEHICLE_COLORS),
          isDefault: v === 0,
          createdAt: FieldValue.serverTimestamp(),
        });
        vehicleCount++;
      }
    }
    await batch.commit();
    process.stdout.write(`\r   Progreso: ${vehicleCount} vehículos creados`);
  }
  console.log(`\n   ✅ ${vehicleCount} vehículos creados`);

  // 6. Seed parking sessions (recent history for ~60% of users)
  console.log("\n🅿️  Creando sesiones de estacionamiento...");
  let sessionCount = 0;
  for (let i = 0; i < userRecords.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = userRecords.slice(i, i + BATCH_SIZE);

    for (const user of chunk) {
      if (Math.random() > 0.6) continue; // 60% have history

      const sessionsPerUser = randomInt(1, 5);
      for (let s = 0; s < sessionsPerUser; s++) {
        const hoursAgo = randomInt(1, 168); // 1h to 7 days ago
        const durationMinutes = randomInt(30, 240);
        const startTime = new Date(Date.now() - hoursAgo * 3600000);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        const zone = pick(ZONES);
        const cost = Math.round(zone.pricePerHour * (durationMinutes / 60));

        const ref = db.collection("parking_sessions").doc();
        batch.set(ref, {
          userId: user.uid,
          zone: zone.name,
          startTime: admin.firestore.Timestamp.fromDate(startTime),
          endTime: admin.firestore.Timestamp.fromDate(endTime),
          cost,
          status: "completed",
          createdAt: FieldValue.serverTimestamp(),
        });
        sessionCount++;
      }
    }
    await batch.commit();
    process.stdout.write(`\r   Progreso: ${sessionCount} sesiones creadas`);
  }
  console.log(`\n   ✅ ${sessionCount} sesiones creadas`);

  // 7. Seed fines (~30% of users have pending fines)
  console.log("\n💰 Creando multas...");
  let fineCount = 0;
  for (let i = 0; i < userRecords.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = userRecords.slice(i, i + BATCH_SIZE);

    for (const user of chunk) {
      if (Math.random() > 0.3) continue; // 30% have fines

      const finesPerUser = randomInt(1, 3);
      for (let f = 0; f < finesPerUser; f++) {
        const ref = db.collection("fines").doc();
        const isPaid = Math.random() < 0.4;
        batch.set(ref, {
          userId: user.uid,
          vehiclePlate: generatePlate(),
          amount: randomInt(500, 5000),
          status: isPaid ? "paid" : "pending",
          zone: pick(ZONES).name,
          reason: pick(["Exceso de tiempo", "Sin pago", "Zona incorrecta", "Parquímetro vencido"]),
          inspectorId: pick(inspectorIds),
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - randomInt(1, 30) * 86400000)
          ),
          paidAt: isPaid ? FieldValue.serverTimestamp() : null,
          createdAt: FieldValue.serverTimestamp(),
        });
        fineCount++;
      }
    }
    await batch.commit();
    process.stdout.write(`\r   Progreso: ${fineCount} multas creadas`);
  }
  console.log(`\n   ✅ ${fineCount} multas creadas`);

  // 8. Seed notifications (~40% of users have notifications)
  console.log("\n🔔 Creando notificaciones...");
  let notifCount = 0;
  for (let i = 0; i < userRecords.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = userRecords.slice(i, i + BATCH_SIZE);

    for (const user of chunk) {
      if (Math.random() > 0.4) continue;

      const notifs = randomInt(1, 4);
      for (let n = 0; n < notifs; n++) {
        const ref = db.collection("notifications").doc();
        batch.set(ref, {
          userId: user.uid,
          type: pick(["parking_expiring", "fine_received", "payment", "system"]),
          title: pick(["Recordatorio", "Multa nueva", "Pago recibido", "Bienvenido"]),
          message: pick([
            "Tu estacionamiento vence en 15 minutos",
            "Tienes una nueva multa pendiente",
            "Se ha acreditado tu pago correctamente",
            "¡Bienvenido a SEOE Wallet!",
          ]),
          priority: pick(["low", "medium", "high"]),
          read: Math.random() < 0.5,
          date: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - randomInt(0, 7) * 86400000)
          ),
          actionUrl: pick(["/", "/fines", "/dashboard"]),
          createdAt: FieldValue.serverTimestamp(),
        });
        notifCount++;
      }
    }
    await batch.commit();
    process.stdout.write(`\r   Progreso: ${notifCount} notificaciones creadas`);
  }
  console.log(`\n   ✅ ${notifCount} notificaciones creadas`);

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("📊 RESUMEN DEL SEED");
  console.log("═══════════════════════════════════════");
  console.log(`   Admin:       1`);
  console.log(`   Inspectores: ${INSPECTOR_COUNT}`);
  console.log(`   Usuarios:    ${userRecords.length}`);
  console.log(`   Vehículos:   ${vehicleCount}`);
  console.log(`   Sesiones:    ${sessionCount}`);
  console.log(`   Multas:      ${fineCount}`);
  console.log(`   Notifs:      ${notifCount}`);
  console.log("═══════════════════════════════════════");
  console.log("");
  console.log("📝 Credenciales de prueba:");
  console.log("   Admin:     admin@seoe.com / admin123456");
  console.log("   Inspectores: inspector1@seoe.com / inspector123");
  console.log("   Usuarios:  user1@seoe.com / usuario123");
  console.log("             (user2@ ... user1000@)");
  console.log("   Todos:     .@seoe.com / 123456 ← misma pass");
  console.log("═══════════════════════════════════════");
}

main().catch(console.error).then(() => process.exit(0));
