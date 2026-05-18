# Sistema de Notificaciones SEOE PWA 1

Este documento detalla la arquitectura, el flujo de datos y el funcionamiento actual del sistema de notificaciones de la aplicación, así como propuestas de mejora.

## 1. Arquitectura General

El sistema de notificaciones opera principalmente del lado del cliente (**Client-Side**), aprovechando la sincronización en tiempo real de Firestore.

### Componentes Principales

1.  **`lib/notifications-context.tsx` (Contexto y Lógica de Datos)**
    *   **Función**: Gestiona el estado global de las notificaciones.
    *   **Escucha (Listener)**: Mantiene una suscripción en tiempo real (`onSnapshot`) a la colección `notifications` de Firestore, filtrando por el `userId` del usuario autenticado.
    *   **Acciones**: Provee funciones para `addNotification` (crear/upsert), `markAsRead` (leer) y `clearNotification` (borrar).
    *   **Deduplicación**: Soporta un campo `customId`. Si se provee, usa `setDoc` para evitar duplicados. Si no, usa `addDoc`.

2.  **`lib/alerts-monitor.tsx` (Generador de Eventos)**
    *   **Función**: Un componente "invisible" que se monta en el layout principal.
    *   **Lógica**: Ejecuta un intervalo cada **30 segundos** para verificar condiciones del sistema:
        *   **Estacionamiento**: Alertas a los 15, 10 y 5 minutos antes de expirar, y al expirar.
            *   IDs únicos: `parking_expiring_${sessionId}_15min`.
        *   **Saldo**: Alerta si el saldo es menor a $50.
            *   ID único: `low_balance_${userId}_${fecha}`.
        *   **Multas**: Recordatorios 3 días antes y el mismo día del vencimiento.
            *   IDs únicos: `fine_reminder_${fineId}_3days`.
    *   **Salida**: Invoca `addNotification` con `customId` para asegurar la unicidad incluso en múltiples dispositivos.

3.  **`components/organisms/notifications-panel.tsx` (Interfaz de Usuario)**
    *   **Función**: Panel deslizable (Sheet) que muestra las notificaciones.
    *   **Características**: Pestañas Activos/Historial, indicadores de prioridad, acciones rápidas.

4.  **Firestore Collection (`notifications`)**
    *   **Estructura del Documento**:
        ```typescript
        {
          id: string; // Auto-generado o customId
          userId: string;
          type: "fine" | "parking_expiring" | "... etc";
          title: string;
          message: string;
          date: Timestamp;
          read: boolean;
          priority: "low" | "medium" | "high" | "urgent";
          actionUrl?: string;
        }
        ```

## 2. Integración con Estacionamiento

Actualmente, el inicio de sesión de estacionamiento se realiza directamente desde el cliente (`lib/parking-context.tsx`) para facilitar pruebas sin despliegue de Backend (Cloud Functions).

*   **Flujo**:
    1.  El usuario inicia estacionamiento -> Se crea doc en `parking_sessions`.
    2.  `AlertsMonitor` (en el cliente) detecta la sesión activa.
    3.  A medida que el tiempo avanza, `AlertsMonitor` dispara las notificaciones con IDs únicos.
    4.  Si el usuario extiende, la sesión se actualiza y las alertas de tiempo se resetean automáticamente al cambiar el `endTime`.

## 3. Próximos pasos recomendados

1.  **Backend (Cloud Functions)**
    - Migrar lógica de `alerts-monitor.tsx` a una Cloud Function con `onSchedule`.
    - La función `checkParkingExpirations` ya existe en `functions/src/index.ts` y se ejecuta cada minuto.
2.  **~~Push Notifications (FCM)~~** ✅ COMPLETADO
    - Se implementó el sistema completo de notificaciones push vía Firebase Cloud Messaging.
    - `functions/src/index.ts`: Nueva función `onNotificationCreated` que dispara FCM cuando se crea un documento en `notifications`.
    - `public/firebase-messaging-sw.js`: Service worker que recibe y muestra las notificaciones en background.
    - `src/shared/lib/fcm.ts`: Utilidad cliente-side para registro de tokens, permisos y mensajes en foreground.
    - `src/entities/auth-context.tsx`: Registro automático del token FCM al iniciar sesión.
    - `src/widgets/push-notification-prompt.tsx`: Banner que solicita permiso de notificaciones al usuario.
    - **Requisito**: Generar VAPID key en Firebase Console > Project Settings > Cloud Messaging y configurarla como `NEXT_PUBLIC_FCM_VAPID_KEY` en el entorno.

## 4. Arquitectura Actualizada

### Flujo de Push Notifications (FCM)

```
1. Usuario inicia sesión
   → auth-context.tsx llama a registerFCMToken(userId)
   → Solicita permiso de notificación (si no concedido)
   → Obtiene FCM token del navegador
   → Guarda token en Firestore: users/{userId}/fcmTokens[]

2. Evento genera notificación
   → Cloud Functions o AlertsMonitor crean documento en notifications/
   → onNotificationCreated (Cloud Function) se dispara
   → Busca fcmTokens del usuario
   → Envía push a todos los dispositivos via admin.messaging().sendEachForMulticast()

3. Dispositivo recibe push
   ─ App en background:
     → firebase-messaging-sw.js muestra notificación nativa
     → Al hacer click, abre la app en la URL correspondiente
   ─ App en foreground:
     → onMessage() captura el payload
     → Se puede mostrar un toast o actualizar el panel de notificaciones
```

### Variables de Entorno Requeridas

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FCM_VAPID_KEY` | VAPID key para Web Push (Firebase Console) |
