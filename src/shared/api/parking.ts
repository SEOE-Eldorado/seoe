import { db } from "@shared/api/firebase"
import {
  collection, query, where, getDocs, doc, setDoc, addDoc, Timestamp, runTransaction
} from "firebase/firestore"
import type { ParkingSession } from "@entities/parking-context"

const COLLECTION = "parking_sessions"
const NOTIFICATIONS_COLL = "notifications"

export async function fetchActiveSessions(userId: string): Promise<ParkingSession[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("status", "in", ["active", "expired"])
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
      endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
      cost: data.cost ?? 0,
      costPerHour: data.costPerHour ?? 0,
    } as ParkingSession
  })
}

export async function checkPlateStatus(licensePlate: string): Promise<ParkingSession | null> {
  const cleanPlate = licensePlate.trim().toUpperCase()
  const q = query(
    collection(db, COLLECTION),
    where("vehiclePlate", "==", cleanPlate),
    where("status", "in", ["active", "expired"])
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const data = snapshot.docs[0].data()
  return {
    id: snapshot.docs[0].id,
    ...data,
    startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
    endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
  } as ParkingSession
}

export async function startParking(data: {
  userId: string
  vehicleId: string
  vehiclePlate: string
  zone: string
  address: string
  hours: number
  cost: number
  lat?: number
  lng?: number
}): Promise<void> {
  const newSessionRef = doc(collection(db, COLLECTION))
  const now = Timestamp.now()
  const endTime = new Date(now.toDate().getTime() + data.hours * 60 * 60 * 1000)

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", data.userId)
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists) throw new Error("Usuario no encontrado")

    const currentBalance = userSnap.data()?.balance ?? 0
    if (currentBalance < data.cost) throw new Error("Saldo insuficiente")

    transaction.set(newSessionRef, {
      id: newSessionRef.id,
      userId: data.userId,
      vehicleId: data.vehicleId,
      vehiclePlate: data.vehiclePlate,
      zone: data.zone,
      address: data.address,
      startTime: now,
      endTime: Timestamp.fromDate(endTime),
      cost: data.cost,
      costPerHour: data.cost / data.hours,
      status: "active",
      location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null,
    })

    transaction.update(userRef, { balance: currentBalance - data.cost })
  })
}

export async function extendParking(sessionId: string, additionalHours: number, cost: number): Promise<void> {
  const sessionRef = doc(db, COLLECTION, sessionId)
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef)
    if (!sessionSnap.exists) throw new Error("Sesión no encontrada")

    const session = sessionSnap.data()
    if (!session) throw new Error("Sesión sin datos")
    const currentEndTime = session.endTime?.toDate ? session.endTime.toDate() : new Date(session.endTime)
    const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000)

    const userRef = doc(db, "users", session.userId)
    const userSnap = await transaction.get(userRef)
    const currentBalance = userSnap.data()?.balance ?? 0
    if (currentBalance < cost) throw new Error("Saldo insuficiente")

    transaction.update(sessionRef, {
      endTime: Timestamp.fromDate(newEndTime),
      cost: (session.cost ?? 0) + cost,
      costPerHour: ((session.cost ?? 0) + cost) / 
        (((newEndTime.getTime() - (session.startTime?.toDate?.() || new Date(session.startTime)).getTime()) / 3600000)),
    })

    transaction.update(userRef, { balance: currentBalance - cost })
  })
}

export async function endParking(sessionId: string): Promise<void> {
  await setDoc(doc(db, COLLECTION, sessionId), {
    status: "completed",
    endTime: Timestamp.now(),
  }, { merge: true })
}
