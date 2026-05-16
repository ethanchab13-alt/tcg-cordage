import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { OrderStatus, Json } from '@/types/database'
import { sendOrderNotification } from '@/lib/notifications'

// Transitions valides : seul le cordeur peut faire avancer le statut
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:     ['in_progress', 'ready'],
  in_progress: ['ready'],
  ready:       ['delivered'],
  delivered:   [],
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier que c'est bien le cordeur via user_metadata
  const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'
  const isCordeur =
    user.user_metadata?.role === 'cordeur' ||
    user.email === CORDEUR_EMAIL

  if (!isCordeur) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Parser le body
  let body: { status?: string; price?: number | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const newStatus = body.status as OrderStatus | undefined

  if (!newStatus) {
    return NextResponse.json({ error: 'Le champ "status" est requis' }, { status: 422 })
  }

  // Récupérer la commande actuelle
  const { data: orderData, error: fetchError } = await supabase
    .from('stringing_orders')
    .select('status')
    .eq('id', id)
    .single()

  const order = orderData as { status: string } | null

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  // Vérifier la transition
  const allowed = VALID_TRANSITIONS[order.status as OrderStatus] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Transition invalide : ${order.status} → ${newStatus}`,
        allowed,
      },
      { status: 422 }
    )
  }

  // Construire les champs de mise à jour
  const updateFields: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'ready') {
    updateFields.ready_at = new Date().toISOString()
  }
  if (newStatus === 'delivered') {
    updateFields.delivered_at = new Date().toISOString()
  }

  // Mettre à jour le prix si fourni
  if (body.price !== undefined) {
    const priceNum = body.price === null ? null : Number(body.price)
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 422 })
    }
    updateFields.price = priceNum
  }

  // Utiliser le client admin pour contourner les RLS sur UPDATE (le cordeur a la policy)
  const adminSupabase = await createAdminClient()

  const { data: updated, error: updateError } = await adminSupabase
    .from('stringing_orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateFields as any)
    .eq('id', id)
    .select('*, profiles(full_name, email)')
    .single()

  if (updateError) {
    console.error('[PATCH /api/orders/[id]/status]', updateError)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  // ── Notifier le client quand la raquette est prête ───────────
  if (newStatus === 'ready') {
    try {
      const { data: clientProfileData } = await adminSupabase
        .from('profiles')
        .select('id, email, full_name, push_subscription')
        .eq('id', (updated as { client_id: string }).client_id)
        .single()

      const clientProfile = clientProfileData as {
        id: string
        email: string
        full_name: string | null
        push_subscription: Json
      } | null

      if (clientProfile) {
        await sendOrderNotification('order_ready', updated!, {
          id:                clientProfile.id,
          email:             clientProfile.email,
          full_name:         clientProfile.full_name,
          push_subscription: clientProfile.push_subscription as Json,
        })
      }
    } catch (notifErr) {
      console.error('[PATCH status] Notification error (non-fatal):', notifErr)
    }
  }

  return NextResponse.json({ order: updated })
}
