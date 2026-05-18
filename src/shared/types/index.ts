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
  role: z.enum(["user", "inspector", "admin"]).default("user"),
  permissions: z.array(z.string()).optional(),
  preferences: z.object({
    pushEnabled: z.boolean().default(true),
    reminderTime: z.number().default(15),
  }).optional(),
})

export type User = z.infer<typeof userSchema>

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

// === Fine ===
export const fineSchema = z.object({
  id: z.string(),
  userId: z.string(),
  vehiclePlate: z.string(),
  amount: z.number(),
  reason: z.string(),
  location: z.string().default(""),
  date: z.date(),
  status: z.enum(["pending", "paid", "contested"]).default("pending"),
  createdAt: z.date(),
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
