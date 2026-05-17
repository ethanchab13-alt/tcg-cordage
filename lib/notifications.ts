/**
 * Orchestrateur de notifications TCG Stringing
 *
 * Stratégie :
 *   1. Tenter le push Web Push si une subscription existe
 *   2. Si push échoue (subscription expirée, refus, etc.), envoyer un email de fallback
 *   3. Logger chaque tentative dans notification_log
 */

import { createAdminClient } from '@/lib/supabase/server'
import { sendPushNotification, type PushPayload } from '@/lib/push'
import { sendEmail, emailOrderCreated, emailOrderReady } from '@/lib/email'
import type { StringingOrder, Profile, Json } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tcg-stringing.vercel.app'

// ── Types internes ────────────────────────────────────────────

type NotifEvent = 'order_created' | 'order_ready'

interface RecipientInfo {
  id: string
  email: string
  full_name: string | null
  push_subscription: Profile['push_subscription']
}

// ── Fonction principale ───────────────────────────────────────

export async function sendOrderNotification(
  event: NotifEvent,
  order: StringingOrder,
  recipient: RecipientInfo
): Promise<void> {
  const supabase = createAdminClient()

  const pushPayload = buildPushPayload(event, order, recipient)
  let notifType: 'push' | 'email' = 'push'
  let notifStatus: 'sent' | 'failed' = 'failed'
  let errorMsg: string | undefined

  // ── 1. Tentative push ────────────────────────────────────────
  if (recipient.push_subscription) {
    const pushResult = await sendPushNotification(
      recipient.push_subscription,
      pushPayload
    )

    if (pushResult.success) {
      notifType   = 'push'
      notifStatus = 'sent'
    } else {
      errorMsg = pushResult.error

      // Subscription expirée → nettoyer le profil
      if (pushResult.error === 'SUBSCRIPTION_EXPIRED') {
        await supabase
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ push_subscription: null } as any)
          .eq('id', recipient.id)
      }
    }
  }

  // ── 2. Fallback email si push absent ou échoué ────────────────
  if (notifStatus !== 'sent') {
    const emailHtml = buildEmailHtml(event, order, recipient)
    const emailSubject = buildEmailSubject(event)

    const emailResult = await sendEmail({
      to:      recipient.email,
      subject: emailSubject,
      html:    emailHtml,
    })

    notifType   = 'email'
    notifStatus = emailResult.success ? 'sent' : 'failed'
    if (!emailResult.success) errorMsg = emailResult.error
  }

  // ── 3. Logger la notification ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from('notification_log').insert({
    order_id:     order.id,
    recipient_id: recipient.id,
    type:         notifType,
    event:        event,
    status:       notifStatus,
    error_msg:    errorMsg ?? null,
  })
}

// ── Builders ────────────────────────────────────────────────

function buildPushPayload(
  event: NotifEvent,
  order: StringingOrder,
  recipient: RecipientInfo
): PushPayload {
  if (event === 'order_created') {
    return {
      title: '🎾 Nouvelle demande de cordage',
      body:  `${recipient.full_name ?? 'Un client'} — ${order.string_type} à ${order.tension_mains} kg`,
      url:   `${APP_URL}/cordeur/dashboard`,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
    }
  }

  // order_ready
  return {
    title: '✅ Votre raquette est prête !',
    body:  `Récupérez votre raquette au Tennis Club La Garde. (${order.string_type})`,
    url:   `${APP_URL}/dashboard`,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  }
}

function buildEmailSubject(event: NotifEvent): string {
  return event === 'order_created'
    ? '🎾 Nouvelle demande de cordage — TCG'
    : '✅ Votre raquette est prête — TCG'
}

function buildEmailHtml(
  event: NotifEvent,
  order: StringingOrder,
  recipient: RecipientInfo
): string {
  if (event === 'order_created') {
    return emailOrderCreated({
      clientName:   recipient.full_name ?? recipient.email,
      stringType:   order.string_type,
      tensionMains: order.tension_mains,
      tensionCross: order.tension_cross,
      racketBrand:  order.racket_brand,
      notes:        order.notes,
    })
  }

  return emailOrderReady({
    clientName:   recipient.full_name ?? recipient.email,
    stringType:   order.string_type,
    tensionMains: order.tension_mains,
    tensionCross: order.tension_cross,
  })
}
