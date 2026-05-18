"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import { ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import { db } from "@shared/api/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

interface Transaction {
  id: string
  type: "recharge" | "parking" | "fine" | "refund"
  amount: number
  description: string
  date: string
  status: "completed" | "pending"
}

interface TransactionHistoryProps {
  limit?: number
  showTitle?: boolean
}

export function TransactionHistory({ limit, showTitle = true }: TransactionHistoryProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchTransactions = async () => {
      try {
        // Fetch parking sessions
        const qParking = query(
          collection(db, "parking_sessions"),
          where("userId", "==", user.id)
        )
        const snapshotParking = await getDocs(qParking)

        // Fetch movements (Recharges, adjustments)
        const qMovements = query(
          collection(db, "movements"),
          where("userId", "==", user.id)
        )
        const snapshotMovements = await getDocs(qMovements)

        const parkingItems = snapshotParking.docs.map(doc => {
          const data = doc.data()
          const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime)

          return {
            id: doc.id,
            type: 'parking',
            amount: -Math.abs(data.cost),
            description: data.zone || data.address || "Estacionamiento",
            date: start.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
            status: "completed",
            timestamp: start.getTime()
          }
        })

        const movementItems = snapshotMovements.docs.map(doc => {
          const data = doc.data()
          // Movement date could be ISO string or Timestamp
          const date = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())

          return {
            id: doc.id,
            type: data.type === 'recharge' ? 'recharge' : 'refund',
            amount: Math.abs(data.amount),
            description: data.description || (data.type === 'recharge' ? "Recarga de Saldo" : "Ajuste de Saldo"),
            date: date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
            status: data.status || "completed",
            timestamp: date.getTime()
          }
        })

        const allItems = [...parkingItems, ...movementItems]
        allItems.sort((a, b) => b.timestamp - a.timestamp)

        const limitedItems = limit ? allItems.slice(0, limit) : allItems
        setTransactions(limitedItems as Transaction[])
      } catch (error) {
        console.error("Error fetching transactions", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  const getIcon = (type: string) => {
    switch (type) {
      case "recharge":
      case "refund":
        return <ArrowUpCircle className="h-5 w-5 text-success" />
      case "parking":
      case "fine":
        return <ArrowDownCircle className="h-5 w-5 text-destructive" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      recharge: "Recarga",
      parking: "Estacionamiento",
      fine: "Multa",
      refund: "Reembolso",
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg">Historial de Transacciones</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3 pt-6">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay transacciones recientes</p>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-sm hover:bg-muted/50 transition-colors"
            >
              <div>{getIcon(transaction.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${transaction.amount > 0 ? "text-success" : "text-foreground"}`}>
                  {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <Badge variant={transaction.status === "completed" ? "secondary" : "outline"} className="text-xs">
                  {transaction.status === "completed" ? "Completado" : "Pendiente"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
