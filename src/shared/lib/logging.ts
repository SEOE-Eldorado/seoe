import { db } from "@shared/api/firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"

export const logAdminAction = async (
    adminId: string,
    adminName: string,
    action: string,
    details: string,
    targetId?: string,
    metadata?: any
) => {
    try {
        await addDoc(collection(db, "audit_logs"), {
            adminId,
            adminName,
            action,
            details,
            targetId,
            metadata,
            timestamp: Timestamp.now()
        })
    } catch (error) {
        console.error("Error logging admin action:", error)
    }
}
