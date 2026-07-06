import { z } from "zod"

// === Timestamp helper (Firebase Timestamp → Date) ===
export const dateFromTimestamp = z.any().transform((v) => {
  if (v?.toDate) return v.toDate()
  if (v instanceof Date) return v
  return new Date(v)
})

// === User ===
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  balance: z.number().default(0),
  autoPayFines: z.boolean().default(false),
  role: z.enum(["user", "seller", "inspector", "admin"]).default("user"),
  permissions: z.array(z.string()).optional(),
  preferences: z.object({
    pushEnabled: z.boolean().default(true),
    reminderTime: z.number().default(15),
  }).optional(),
  blocked: z.boolean().optional(),
  createdAt: z.any().optional(),
  assignedZones: z.array(z.string()).optional(),
  lastActivity: z.any().optional(),
  lastLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  lastPlateCheck: z.string().optional(),
})

export type User = z.infer<typeof userSchema>

// === Exemption ===
export const exemptionSchema = z.object({
  id: z.string(),
  dni: z.string(),
  name: z.string(),
  plate: z.string(),
  type: z.enum(["disability", "resident"]),
  exemptedStreets: z.string().optional(),
  createdAt: z.any(),
})
export type Exemption = z.infer<typeof exemptionSchema>

// === Parking Session ===
export const parkingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  vehicleId: z.string(),
  vehiclePlate: z.string(),
  zone: z.string(),
  address: z.string().default(""),
  startTime: z.date(),
  endTime: z.date(),
  cost: z.number().default(0),
  costPerHour: z.number().default(0),
  status: z.enum(["active", "completed", "expired"]).default("active"),
  location: z.object({ lat: z.number(), lng: z.number() }).optional().nullable(),
})

export type ParkingSession = z.infer<typeof parkingSessionSchema>

// === Vehicle ===
export const vehicleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  plate: z.string(),
  brand: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  year: z.number().optional(),
  color: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
})

export type Vehicle = z.infer<typeof vehicleSchema>

// === Fine (canonical — single source of truth) ===
export const fineSchema = z.object({
  id: z.string(),
  userId: z.string(),
  vehiclePlate: z.string(),
  amount: z.number(),
  reason: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["overtime", "no_payment", "wrong_zone", "expired_meter"]).optional(),
  location: z.string().default(""),
  zone: z.string().default(""),
  date: dateFromTimestamp,
  status: z.enum(["pending", "paid", "contested", "cancelled"]).default("pending"),
  createdAt: dateFromTimestamp,
  dueDate: dateFromTimestamp.optional(),
  notes: z.string().optional(),
  inspectorId: z.string().optional(),
  inspectorName: z.string().optional(),
  cancelledAt: dateFromTimestamp.optional(),
  cancelledBy: z.string().optional(),
  cancelReason: z.string().optional(),
  paidAt: dateFromTimestamp.optional(),
})

export type Fine = z.infer<typeof fineSchema>

// === Transaction / Movement ===
export const movementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["recharge", "parking", "adjustment", "fine_payment"]),
  amount: z.number(),
  description: z.string().default(""),
  status: z.enum(["pending", "completed", "failed"]).default("completed"),
  date: z.date(),
})

export type Movement = z.infer<typeof movementSchema>

// === Notification ===
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "warning", "fine", "reminder", "urgent"]).default("info"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  read: z.boolean().default(false),
  date: z.date(),
})

export type Notification = z.infer<typeof notificationSchema>

// === Payment / Recharge ===
export const rechargeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["mercadopago", "cash", "transfer", "card"]).default("mercadopago"),
  status: z.enum(["pending", "completed", "failed"]).default("pending"),
  externalRef: z.string().optional().or(z.literal("")),
  date: z.date(),
})

export type Recharge = z.infer<typeof rechargeSchema>

// === Transaction (admin payments) ===
export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  amount: z.number(),
  status: z.enum(["completed", "pending", "failed", "refunded"]).default("completed"),
  method: z.string(),
  type: z.enum(["credit", "debit"]).optional(),
  timestamp: z.any(),
  gatewayResponseCode: z.string().optional(),
  gatewayMessage: z.string().optional(),
  externalReference: z.string().optional(),
  referenceId: z.string().optional(),
})
export type Transaction = z.infer<typeof transactionSchema>

// === PaymentSettings (admin) ===
export const paymentSettingsSchema = z.object({
  enableMacroClick: z.boolean().default(true),
  enableCash: z.boolean().default(true),
  promotions: z.object({
    active: z.boolean().default(false),
    minAmount: z.number().default(100),
    bonusPercentage: z.number().default(10),
  }).default({ active: false, minAmount: 100, bonusPercentage: 10 }),
})
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>
