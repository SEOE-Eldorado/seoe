import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
  try {
    // Sign in with existing admin@seoe.com
    const userCred = await signInWithEmailAndPassword(auth, "admin@seoe.com", "AdminSEOE2026!");
    const uid = userCred.user.uid;
    console.log("✅ Signed in as:", uid);

    // Check current role
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      console.log("Current role:", userDoc.data().role);
      console.log("Current data:", JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log("No Firestore document exists yet. Creating one with admin role...");
      await setDoc(doc(db, "users", uid), {
        name: "Administrador SEOE",
        email: "admin@seoe.com",
        phone: "+54937510000",
        balance: 0,
        autoPayFines: false,
        role: "admin",
        preferences: { pushEnabled: true, reminderTime: 10 },
        createdAt: new Date(),
      });
      console.log("✅ Created Firestore doc with admin role!");
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.code, err.message);
    process.exit(1);
  }
}

main();
