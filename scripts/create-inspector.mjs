import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
  const email = "inspector.postnet@seoe.com";
  const password = "Inspector2026!";

  try {
    // Sign in
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("Signed in as:", uid);

    // Create Firestore document
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      name: "Inspector Postnet",
      email: email,
      phone: "+543765001001",
      role: "inspector",
      balance: 0,
      autoPayFines: false,
      createdAt: new Date(),
    });

    console.log("Firestore document created with role: inspector");
    console.log("User ready for postnet!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
