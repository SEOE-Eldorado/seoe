"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { auth, db } from "@shared/api/firebase"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User as FirebaseUser
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, increment, addDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface User {
  id: string
  name: string
  email: string
  phone: string
  balance: number
  autoPayFines: boolean
  role: "user" | "inspector" | "admin"
  permissions?: string[]
  preferences?: {
    pushEnabled: boolean
    reminderTime: number // minutes
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrPhone: string, password: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => void
  updateBalance: (amount: number) => Promise<void>
  toggleAutoPayFines: () => void
  loginWithGoogle: () => Promise<void>
  setupRecaptcha: (elementId: string) => void
  startPhoneVerification: (phoneNumber: string) => Promise<void>
  confirmPhoneVerification: (code: string) => Promise<any>
  updatePreferences: (prefs: Partial<User["preferences"]>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!firebaseUser) {
      setUserProfile(null)
      return
    }

    setProfileLoading(true)
    const userRef = doc(db, "users", firebaseUser.uid)
    
    const unsubscribeProfile = onSnapshot(userRef, async (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Special case for inspector auto-correction if needed
        if (firebaseUser.email === 'inspector@seoe.com' && data.role !== 'inspector') {
          await updateDoc(userRef, { role: 'inspector' })
          data.role = 'inspector'
        }
        setUserProfile({ id: firebaseUser.uid, ...data } as User)
      } else {
        const newUser = {
          name: firebaseUser.displayName || "Usuario",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
          balance: 0,
          autoPayFines: false,
          role: "user" as const,
          createdAt: new Date(),
        }
        await setDoc(userRef, newUser)
        // onSnapshot will trigger again for the new doc
      }
      setProfileLoading(false)
    }, (error: any) => {
      console.error("Profile snapshot error:", error)
      setProfileLoading(false)
    })

    return () => unsubscribeProfile()
  }, [firebaseUser])

  // Register FCM push token when user profile is loaded
  useEffect(() => {
    if (userProfile?.id && userProfile?.preferences?.pushEnabled !== false) {
      // Lazy import to avoid circular dependencies and only load when needed
      import("@shared/lib/fcm").then((fcm) => {
        fcm.registerFCMToken(userProfile.id).catch((err) => {
          console.warn("[FCM] Token registration deferred:", err)
        })
      })
    }
  }, [userProfile?.id])

  const loading = authLoading || (!!firebaseUser && profileLoading)
  const user = userProfile

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const identifier = emailOrPhone.trim()
      let emailToUse = identifier

      // Basic check: if it doesn't have an @ and contains only phone-like chars
      const isPhone = !identifier.includes("@") && /^[+0-9\s-]+$/.test(identifier)

      if (isPhone) {
        // Normalize phone for searching
        let formattedPhone = identifier
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+54" + formattedPhone
        }

        try {
          // Search for user by phone
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("phone", "==", formattedPhone))
          const snapshot = await getDocs(q)

          if (snapshot.empty) {
            throw new Error("NOT_REGISTERED")
          }

          const userData = snapshot.docs[0].data()
          emailToUse = userData.email
        } catch (dbError: any) {
          if (dbError.message === "NOT_REGISTERED") throw dbError
          if (dbError.code === "permission-denied") {
            throw new Error("Error de permisos al buscar el teléfono. Intenta con tu email.")
          }
          throw dbError
        }
      }

      await signInWithEmailAndPassword(auth, emailToUse, password)
    } catch (error: any) {
      if (error.message === "NOT_REGISTERED") {
        throw new Error("Este número de teléfono no está registrado. Por favor, regístrate.")
      }
      if (error.message.includes("Error de permisos")) {
        throw error
      }

      console.error("Login failed", error)
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        throw new Error("Credenciales inválidas. Verifica tu usuario y contraseña.")
      }
      throw new Error("Error al iniciar sesión: " + error.message)
    }
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const emailTrim = email.trim().toLowerCase()
      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+54" + formattedPhone
      }

      // Existence checks (Graceful handling of permission errors)
      try {
        // 1. Check if email exists in Firestore
        const emailQuery = query(collection(db, "users"), where("email", "==", emailTrim))
        const emailSnap = await getDocs(emailQuery)
        if (!emailSnap.empty) {
          throw new Error("EMAIL_EXISTS")
        }

        // 2. Check if phone exists in Firestore
        const phoneQuery = query(collection(db, "users"), where("phone", "==", formattedPhone))
        const phoneSnap = await getDocs(phoneQuery)
        if (!phoneSnap.empty) {
          throw new Error("PHONE_EXISTS")
        }
      } catch (checkError: any) {
        // If it's one of our thrown errors, rethrow it
        if (checkError.message === "EMAIL_EXISTS" || checkError.message === "PHONE_EXISTS") throw checkError
        // Otherwise, it might be a permission error. Log it and proceed.
        // Firebase Auth will still catch duplicate emails.
        console.warn("Pre-registration check skipped due to permissions:", checkError.message)
      }

      const userCredential = await createUserWithEmailAndPassword(auth, emailTrim, password)
      const user = userCredential.user

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: emailTrim,
        phone: formattedPhone,
        balance: 0,
        autoPayFines: false,
        // Role is always 'user' by default. Admins must assign 'inspector'/'admin' roles
        // manually via the admin panel or a privileged Cloud Function.
        role: "user" as const,
        preferences: {
          pushEnabled: true,
          reminderTime: 10,
        },
        createdAt: new Date(),
      })
    } catch (error: any) {
      if (error.message === "EMAIL_EXISTS") {
        throw new Error("Este correo electrónico ya está registrado.")
      }
      if (error.message === "PHONE_EXISTS") {
        throw new Error("Este número de teléfono ya está registrado.")
      }
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Este correo electrónico ya está en uso por otra cuenta.")
      }

      console.error("Registration failed", error)
      throw new Error("Error al registrarse: " + (error.message || "Inténtalo de nuevo."))
    }
  }

  const logout = async () => {
    try {
      // signOut first, then clean up local state to avoid a partial-logout race condition
      await signOut(auth)
      setFirebaseUser(null)
      queryClient.clear()
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const updateBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!userProfile || !firebaseUser) return
      const userRef = doc(db, "users", firebaseUser.uid)
      await updateDoc(userRef, {
        balance: increment(amount)
      })

      // Record movement
      await addDoc(collection(db, "movements"), {
        userId: firebaseUser.uid,
        type: "recharge",
        amount: amount,
        date: new Date().toISOString(), // Use ISO string for easier client handling or Firestore Timestamp
        description: "Recarga de saldo",
        status: "completed"
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile', firebaseUser?.uid] })
  })

  const toggleAutoPayFinesMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile || !firebaseUser) return
      const userRef = doc(db, "users", firebaseUser.uid)
      await updateDoc(userRef, { autoPayFines: !userProfile.autoPayFines })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile', firebaseUser?.uid] })
  })

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(userRef)

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "Usuario Google",
          email: user.email,
          phone: user.phoneNumber || "",
          balance: 0,
          autoPayFines: false,
          role: "user",
          createdAt: new Date()
        })
      }
    } catch (error: any) {
      console.error("Google login failed", error)
      throw new Error("Error con Google: " + error.message)
    }
  }

  // MEMOIZED FUNCTIONS TO PREVENT RE-RENDERS LOOPS
  const setupRecaptchaCallback = useCallback((elementId: string) => {
    // Clear existing if any to avoid "element removed" issues if component re-mounted
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear()
      } catch (e) {
        // Ignore error if clear fails (e.g. not rendered)
      }
    }

    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: () => {
        console.log("Recaptcha solved")
      },
    })
    recaptchaVerifierRef.current = verifier
  }, [])

  const startPhoneVerification = useCallback(async (phoneNumber: string) => {
    if (!recaptchaVerifierRef.current) throw new Error("Recaptcha not initialized")
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current)
      setConfirmationResult(confirmation)
    } catch (error: any) {
      console.error("Error sending SMS", error)
      // If error suggests recaptcha issue, maybe we should clear it?
      if (error.code === 'auth/invalid-app-credential') {
        // specific handling
      }
      throw new Error("Error al enviar SMS: " + error.message)
    }
  }, [])

  const confirmPhoneVerification = useCallback(async (code: string) => {
    if (!confirmationResult) throw new Error("No verification info found")
    try {
      const result = await confirmationResult.confirm(code)
      return result.user
    } catch (error: any) {
      console.error("Error verifying code", error)
      throw new Error("Código inválido")
    }
  }, [confirmationResult])

  const updatePreferences = async (prefs: Partial<NonNullable<User["preferences"]>>) => {
    if (!user) return
    try {
      const newPrefs = { ...(user.preferences || { pushEnabled: true, reminderTime: 10 }), ...prefs }
      await updateDoc(doc(db, "users", user.id), {
        preferences: newPrefs
      })
    } catch (error) {
      console.error("Error updating preferences:", error)
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateBalance: async (amount) => await updateBalanceMutation.mutateAsync(amount),
        toggleAutoPayFines: () => toggleAutoPayFinesMutation.mutate(),
        loginWithGoogle,
        setupRecaptcha: setupRecaptchaCallback,
        startPhoneVerification,
        confirmPhoneVerification,
        updatePreferences,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
