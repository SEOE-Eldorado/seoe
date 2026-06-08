import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
    const userCred = await signInWithEmailAndPassword(auth, "inspector.postnet@seoe.com", "Inspector2026!");
    const uid = userCred.user.uid;
    const docSnap = await getDoc(doc(db, "users", uid));
    const data = docSnap.data();
    console.log("name:", data.name);
    console.log("email:", data.email);
    console.log("phone:", data.phone);
    console.log("role:", data.role);
    console.log("balance:", data.balance);
    console.log("autoPayFines:", data.autoPayFines);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
