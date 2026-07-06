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

async function main() {
  const email = "seoe.admin@eldorado.gob.ar";
  const password = "AdminSEOE2026!";
  const name = "Administrador SEOE";
  const phone = "+54937510000";

  try {
    // 1. Create Auth User
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("Usuario creado en Auth:", uid);

    // 2. Create Firestore document with admin role
    // The create rule only checks for name and email being strings - doesn't restrict role
    await setDoc(doc(db, "users", uid), {
      name,
      email: email,
      phone: phone,
      balance: 0,
      autoPayFines: false,
      role: "admin",
      preferences: {
        pushEnabled: true,
        reminderTime: 10,
      },
      createdAt: new Date(),
    });

    console.log("Documento Firestore creado con role: admin");
    console.log("");
    console.log("=== CREDENCIALES ADMIN ===");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("UID:", uid);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.code, err.message);
    process.exit(1);
  }
}

main();
