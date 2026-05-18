export const APP_CONFIG = {
    name: "SEOE - Sistema de Estacionamiento",
    currency: "ARS",
    locale: "es-AR",
}

export const STORAGE_KEYS = {
    USER: "seoe-user",
    USERS: "seoe-users",
    TOKEN: "seoe-token",
    THEME: "seoe-theme",
    PARKING_SESSION: (userId: string) => `seoe-parking-${userId}`,
    PARKING_HISTORY: (userId: string) => `seoe-history-${userId}`,
    VEHICLES: (userId: string) => `seoe-vehicles-${userId}`,
    FINES: (userId: string) => `seoe-fines-${userId}`,
    NOTIFICATIONS: (userId: string) => `seoe-notifications-${userId}`,
}

export const LIMITS = {
    MIN_BALANCE: -1000,
    MAX_HOURS: 24,
}
