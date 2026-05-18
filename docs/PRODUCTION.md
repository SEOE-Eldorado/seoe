# SEOE Wallet — Guía de Producción

## 🚀 Deploy rápido

### 1. Firebase

```bash
# Login
firebase login

# Desplegar Firestore rules
firebase deploy --only firestore:rules

# Desplegar índices
firebase deploy --only firestore:indexes

# Desplegar Cloud Functions
cd functions && npm run deploy
```

### 2. Aplicación Web (Next.js)

```bash
# Build
npm run build

# Iniciar (producción)
npm run start
```

O desplegar en Vercel:
```bash
npx vercel --prod
```

### 3. Seed de datos de prueba

```bash
# Con emuladores locales
node scripts/seed.cjs --emulator --count=100

# Contra producción (requiere service-account.json)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed.cjs --count=1000
```

## 📦 Stack

| Componente | Tecnología |
|------------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 + Shadcn/ui |
| Estado | TanStack Query + Context |
| Backend | Firebase (Auth, Firestore, Functions, FCM) |
| PWA | next-pwa + vite-plugin-pwa |
| Android | Capacitor |
| Monitoreo | Sentry |
| i18n | next-intl (es/en) |

## 🔐 Credenciales por defecto

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@seoe.com | admin123456 |
| Inspector | inspector1@seoe.com | inspector123 |
| Inspector | inspector2@seoe.com | inspector123 |
| Usuario | user1@seoe.com | usuario123 |

## 🔑 Variables de entorno requeridas

| Variable | Dónde obtenerla |
|----------|-----------------|
| `NEXT_PUBLIC_FCM_VAPID_KEY` | Firebase Console > Cloud Messaging > Web Push |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Firebase Console > App Check > reCAPTCHA Enterprise |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Console > Service Accounts > Generate Key |

## 📊 Firebase Costos (Spark Plan — Gratis)

| Recurso | Límite diario | Consumo estimado (1000 users) |
|---------|---------------|-------------------------------|
| Firestore reads | 50.000 | ~500/día |
| Firestore writes | 20.000 | ~2.000/día |
| Auth | 50.000/mes | ~1.000/mes |
| Cloud Functions | 2M/mes | ~10.000/mes |
| FCM | Ilimitado | ~500/día |

El plan Spark es suficiente para 1000 usuarios activos.

## ⚡ Performance

- First Load JS compartido: **215 kB**
- Rutas dinámicas: **1.6 kB - 169 kB** cada una
- Offline persistence habilitada (Firestore cache)
- PWA instalable con service worker
- Lazy loading en rutas pesadas (inspector: 169 kB)
- i18n con carga lazy de traducciones

## 🧪 Tests

```bash
# Unit tests
npm run test

# E2E (requiere dev server + Firebase emulators)
npx playwright test
```

## 📁 Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `firestore.rules` | Reglas de seguridad (producción) |
| `firestore.indexes.json` | Índices compuestos |
| `scripts/seed.cjs` | Generar 1000+ usuarios de prueba |
| `.env.production` | Template de variables de entorno |
| `functions/src/index.ts` | Cloud Functions (auto-pay, FCM push, scheduler) |
| `public/firebase-messaging-sw.js` | Service worker FCM |
| `src/shared/lib/fcm.ts` | Gestión de tokens FCM |
