
import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@shared/api/firebase"
import { useAuth } from "@entities/auth-context"

export function useUserFines() {
    const { user } = useAuth()
    const [fines, setFines] = useState<any[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setFines([])
            setPendingCount(0)
            return
        }

        // Consult: Fines assigned to this user, ordered by date
        const q = query(
            collection(db, "fines"),
            where("userId", "==", user.id), // Important: Filter by user ID
            orderBy("timestamp", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to JS Date if necessary
                createdAt: doc.data().timestamp?.toDate()
            }))
            setFines(docs)

            // Calculate how many are pending payment
            const pending = docs.filter((f: any) => f.status === 'pending').length
            setPendingCount(pending)

            setLoading(false)
        }, (error) => {
            console.error("Error fetching fines:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    return { fines, pendingCount, loading }
}
