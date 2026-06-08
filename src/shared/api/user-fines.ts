import { db } from "./firebase"
import { collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc, Timestamp, writeBatch } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import type { Fine } from "@shared/types"

const COLLECTION = "fines"

/**
 * Fetch all fines for a specific user.
 */
export async function fetchUserFines(userId: string): Promise<Fine[]> {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      userId: data.userId,
      vehiclePlate: data.vehiclePlate,
      type: data.type,
      amount: data.amount,
      reason: data.reason ?? data.description ?? "",
      description: data.description ?? data.reason ?? "",
      location: data.location ?? "",
      zone: data.zone ?? "",
      date: data.date?.toDate?.() ?? new Date(),
      status: data.status,
      dueDate: data.dueDate?.toDate?.() ?? undefined,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      notes: data.notes,
      inspectorId: data.inspectorId,
      inspectorName: data.inspectorName,
      cancelledAt: data.cancelledAt?.toDate?.() ?? undefined,
      cancelledBy: data.cancelledBy,
      cancelReason: data.cancelReason,
      paidAt: data.paidAt?.toDate?.() ?? undefined,
    } as Fine
  })
}

/**
 * Pay a fine via the Cloud Function.
 */
export async function payUserFine(fineId: string): Promise<void> {
  const functions = getFunctions(undefined, "us-central1")
  const payFineFn = httpsCallable(functions, "payFine")
  await payFineFn({ fineId })
}

/**
 * Appeal / contest a fine.
 */
export async function appealUserFine(fineId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, fineId), { status: "contested" })
}

/**
 * Issue a new fine (inspector/admin only).
 */
export async function issueFine(
  fineData: Omit<Fine, "id" | "status" | "date" | "dueDate" | "createdAt" | "cancelledAt" | "cancelledBy" | "cancelReason" | "paidAt" | "notes" | "inspectorId" | "inspectorName">,
  inspectorId?: string,
  inspectorName?: string,
): Promise<void> {
  const now = new Date()
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const batch = writeBatch(db)

  const fineRef = doc(collection(db, COLLECTION))
  batch.set(fineRef, {
    ...fineData,
    zone: fineData.zone || fineData.location || "No especificada",
    reason: fineData.reason || fineData.description || "",
    description: fineData.description || fineData.reason || "",
    status: "pending",
    date: Timestamp.fromDate(now),
    dueDate: Timestamp.fromDate(dueDate),
    createdAt: Timestamp.fromDate(now),
    inspectorId,
    inspectorName,
  })

  await batch.commit()

  // Try to create notification separately (may fail if not admin)
  try {
    const fineTypeLabels: Record<string, string> = {
      overtime: "Exceso de tiempo",
      no_payment: "Sin pago registrado",
      wrong_zone: "Zona incorrecta",
      expired_meter: "Medidor vencido",
    }
    const notifRef = doc(collection(db, "notifications"))
    await setDoc(notifRef, {
      userId: fineData.userId,
      type: "fine",
      title: "⚠️ Multa recibida",
      message: `Se registró una multa de $${fineData.amount} en ${fineData.location}. Motivo: ${fineData.type ? fineTypeLabels[fineData.type] : fineData.reason ?? fineData.description ?? ""}. Vence el ${dueDate.toLocaleDateString("es-AR")}.`,
      priority: "high",
      actionUrl: "/fines",
      date: Timestamp.fromDate(now),
      read: false,
    })
  } catch (notifErr) {
    console.warn("Could not create notification (non-admin):", notifErr)
  }
}

/** Helper: get pending fines from a list */
export function getPendingFines(fines: Fine[]): Fine[] {
  return fines.filter((f) => f.status === "pending")
}

/** Helper: get total pending amount */
export function getTotalPendingAmount(fines: Fine[]): number {
  return fines.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0)
}
