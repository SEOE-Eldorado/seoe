import { db } from "@shared/api/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

export interface Fine {
  id: string
  userId: string
  vehiclePlate: string
  amount: number
  reason: string
  location: string
  date: Date
  status: "pending" | "paid" | "contested"
  createdAt: Date
}

export async function fetchUserFines(userId: string): Promise<Fine[]> {
  const q = query(collection(db, "fines"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    } as Fine
  })
}

export async function payFine(fineId: string): Promise<void> {
  await updateDoc(doc(db, "fines", fineId), { status: "paid" })
}
