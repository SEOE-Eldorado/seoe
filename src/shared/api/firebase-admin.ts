import { initializeApp, getApps, getApp, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

const firebaseCertPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? JSON.parse(
      require("fs").readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
    )
  : undefined

// Initialize Firebase Admin (only on server)
function initFirebaseAdmin() {
  if (getApps().length === 0) {
    if (firebaseCertPath) {
      initializeApp({
        credential: cert(firebaseCertPath),
      })
    } else {
      // Fallback for local development when env vars are set
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "seoe-67101",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
      })
    }
  }
  return getApps()[0]
}

initFirebaseAdmin()

export const adminAuth = getAuth()
export const adminDb = getFirestore()
