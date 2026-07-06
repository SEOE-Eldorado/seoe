import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3LBGWIV4gr_vR8-Xhh4PWUD5LKJnZKaY",
  authDomain: "seoe-67101.firebaseapp.com",
  projectId: "seoe-67101",
  storageBucket: "seoe-67101.firebasestorage.app",
  messagingSenderId: "1069306892632",
  appId: "1:1069306892632:web:9fcabbbd783faf9694552d",
  measurementId: "G-MXY95ZC88P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: "seoe.user@eldorado.gob.ar",
    password: "UserSEOE2026!",
    name: "Usuario Demo SEOE",
    phone: "+5493751000001",
    role: "user",
  },
  {
    email: "seoe.seller@eldorado.gob.ar",
    password: "SellerSEOE2026!",
    name: "Vendedor Demo SEOE",
    phone: "+5493751000002",
    role: "seller",
  },
  {
    email: "seoe.inspector@eldorado.gob.ar",
    password: "InspectorSEOE2026!",
    name: "Inspector Demo SEOE",
    phone: "+5493751000003",
    role: "inspector",
  },
];

async function main() {
  for (const u of users) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        name: u.name,
        email: u.email,
        phone: u.phone,
        balance: 0,
        autoPayFines: false,
        role: u.role,
        preferences: {
          pushEnabled: true,
          reminderTime: 10,
        },
        createdAt: new Date(),
      });

      console.log(`✅ ${u.role.toUpperCase()} creado — ${u.email} / ${u.password} (UID: ${uid})`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`⚠️  ${u.role} ya existe — ${u.email} / ${u.password}`);
      } else {
        console.error(`❌ Error ${u.role}:`, err.code, err.message);
      }
    }
  }
  console.log("");
  console.log("=== CREDENCIALES COMPLETAS ===");
  console.log("ADMIN:     seoe.admin@eldorado.gob.ar / AdminSEOE2026!");
  console.log("USER:      seoe.user@eldorado.gob.ar / UserSEOE2026!");
  console.log("SELLER:    seoe.seller@eldorado.gob.ar / SellerSEOE2026!");
  console.log("INSPECTOR: seoe.inspector@eldorado.gob.ar / InspectorSEOE2026!");
  process.exit(0);
}

main();
