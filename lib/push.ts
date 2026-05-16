import webpush from 'web-push'
import type { Json } from '@/types/database'

// Initialiser web-push avec les clés VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url: string
  icon?: string
  badge?: string
  actions?: Array<{ action: string; title: string }>
}

/**
 * Envoie une notification Web Push à une subscription donnée.
 * Retourne `true` si succès, `false` + l'erreur si échec.
 */
export async function sendPushNotification(
  subscription: Json,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!subscription || typeof subscription !== 'object' || Array.isArray(subscription)) {
    return { success: false, error: 'Subscription invalide' }
  }

  // La subscription est stockée en JSONB, la retyper en PushSubscription
  const pushSubscription = subscription as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!pushSubscription.endpoint || !pushSubscription.keys) {
    return { success: false, error: 'Subscription incomplète' }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: pushSubscription.keys.p256dh,
          auth:   pushSubscription.keys.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    // 410 Gone = subscription expirée ou révoquée côté navigateur
    if (message.includes('410') || message.includes('404')) {
      return { success: false, error: 'SUBSCRIPTION_EXPIRED' }
    }

    console.error('[push] Erreur envoi push:', message)
    return { success: false, error: message }
  }
}
