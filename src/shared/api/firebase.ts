import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

import firebaseConfig from "./firebaseConfig";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
}

let analytics;
if (typeof window !== "undefined") {
    // Enable Firestore offline persistence (cache data locally for offline use)
    enableMultiTabIndexedDbPersistence(db)
        .then(() => console.log("[Firestore] Offline persistence enabled"))
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("[Firestore] Persistence failed: multiple tabs open")
            } else if (err.code === 'unimplemented') {
                console.warn("[Firestore] Persistence not supported by this browser")
            }
        })

    // Initialize Analytics
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });

    // Initialize AppCheck to protect Firestore and Functions from abuse
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });
    } else {
        console.warn("Firebase AppCheck is lacking a RECAPTCHA_SITE_KEY. It is recommended for Enterprise environments.");
    }
}

export { app, auth, db, analytics, functions };

