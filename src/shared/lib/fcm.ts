"use client"

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@shared/api/firebase"
import { app } from "@shared/api/firebase"

const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || ""

/**
 * Register FCM token for push notifications.
 * Requests permission, gets token, and saves it to the user's Firestore document.
 */
export async function registerFCMToken(userId: string): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported) {
      console.log("[FCM] Push notifications not supported in this browser")
      return null
    }

    const messaging = getMessaging(app)
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await getOrRegisterSW(),
    })

    if (currentToken) {
      console.log("[FCM] Token obtained:", currentToken.substring(0, 20) + "...")
      // Save token to user's Firestore document
      await saveFCMToken(userId, currentToken)
      return currentToken
    } else {
      console.log("[FCM] No registration token available. Request permission first.")
      return null
    }
  } catch (error) {
    console.error("[FCM] Error registering token:", error)
    return null
  }
}

/**
 * Unregister FCM token (e.g., when user logs out or disables notifications).
 */
export async function unregisterFCMToken(userId: string): Promise<void> {
  try {
    const supported = await isSupported()
    if (!supported) return

    const messaging = getMessaging(app)
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    }).catch(() => null)

    if (currentToken && userId) {
      // Remove token from user's Firestore document
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(currentToken),
      })
      console.log("[FCM] Token removed from user document")
    }
  } catch (error) {
    console.error("[FCM] Error unregistering token:", error)
  }
}

/**
 * Listen for foreground messages (when the app is open).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  let unsubscribe: (() => void) | null = null

  isSupported().then((supported) => {
    if (!supported) return

    try {
      const messaging = getMessaging(app)
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground message received:", payload)
        callback(payload)
      })
    } catch (error) {
      console.error("[FCM] Error setting up foreground listener:", error)
    }
  })

  return () => {
    if (unsubscribe) unsubscribe()
  }
}

/**
 * Check if notification permission is granted.
 */
export async function getNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof Notification === "undefined") return null
  return Notification.permission
}

/**
 * Request notification permission explicitly.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("[FCM] Error requesting notification permission:", error)
    return false
  }
}

// --- Internal helpers ---

async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
    })
    console.log("[FCM] Token saved to user document")
  } catch (error) {
    console.error("[FCM] Error saving token:", error)
  }
}

let swRegistration: ServiceWorkerRegistration | null = null

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  if (swRegistration) return swRegistration

  if ("serviceWorker" in navigator) {
    // Check if firebase-messaging-sw.js is already registered
    const registrations = await navigator.serviceWorker.getRegistrations()
    const existingFCM = registrations.find(
      (reg) => reg.active?.scriptURL?.includes("firebase-messaging-sw")
    )
    if (existingFCM) {
      swRegistration = existingFCM
      return existingFCM
    }

    // Register the FCM service worker
    swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    console.log("[FCM] Service worker registered:", swRegistration)
  }

  return swRegistration!
}
