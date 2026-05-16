import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendOrderNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier que c'est bien un client (pas un cordeur) via user_metadata
  const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'
  const isCordeur =
    user.user_metadata?.role === 'cordeur' ||
    user.email === CORDEUR_EMAIL

  if (isCordeur) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Parser et valider le body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const {
    racket_brand,
    string_type,
    tension_mains,
    tension_cross,
    notes,
  } = body as Record<string, unknown>

  // Validation des champs obligatoires
  if (!string_type || typeof string_type !== 'string' || string_type.trim() === '') {
    return NextResponse.json({ error: 'Le type de cordage est requis' }, { status: 422 })
  }

  const tensionMainsNum = Number(tension_mains)
  if (isNaN(tensionMainsNum) || tensionMainsNum < 15 || tensionMainsNum > 35) {
    return NextResponse.json(
      { error: 'La tension mains doit être entre 15 et 35 kg' },
      { status: 422 }
    )
  }

  const tensionCrossNum = tension_cross != null ? Number(tension_cross) : null
  if (tensionCrossNum !== null && (isNaN(tensionCrossNum) || tensionCrossNum < 15 || tensionCrossNum > 35)) {
    return NextResponse.json(
      { error: 'La tension croisée doit être entre 15 et 35 kg' },
      { status: 422 }
    )
  }

  // Insérer la commande via admin client (bypass RLS)
  const adminForInsert = await createAdminClient()
  const { data: order, error: insertError } = await adminForInsert
    .from('stringing_orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      client_id:     user.id,
      racket_brand:  typeof racket_brand === 'string' ? racket_brand.trim() || null : null,
      string_type:   string_type.trim(),
      tension_mains: tensionMainsNum,
      tension_cross: tensionCrossNum,
      notes:         typeof notes === 'string' ? notes.trim() || null : null,
      status:        'pending',
    })
    .select()
    .single()

  if (insertError) {
    console.error('[POST /api/orders]', insertError)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }

  // ── Notifier le cordeur (push + fallback email) ──────────────
  // Opération non-bloquante : on ne fait pas échouer la requête si la notif plante
  try {
    const adminSupabase = await createAdminClient()

    // Récupérer le(s) compte(s) cordeur
    const { data: rawCordeurs } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, push_subscription')
      .eq('role', 'cordeur')
    const cordeurs = rawCordeurs as Array<{ id: string; email: string; full_name: string | null; push_subscription: import('@/types/database').Json }> | null

    if (cordeurs && cordeurs.length > 0) {
      // Récupérer le profil client pour personnaliser la notif
      const { data: clientProfileData } = await adminSupabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const clientProfile = clientProfileData as { full_name: string | null; email: string } | null

      const orderWithClientName = order! as import('@/types/database').StringingOrder

      await Promise.allSettled(
        cordeurs.map((cordeur) =>
          sendOrderNotification('order_created', orderWithClientName, {
            id:                cordeur.id,
            email:             cordeur.email,
            full_name:         clientProfile?.full_name ?? null,
            push_subscription: cordeur.push_subscription,
          })
        )
      )
    }
  } catch (notifErr) {
    console.error('[POST /api/orders] Notification error (non-fatal):', notifErr)
  }

  return NextResponse.json({ order }, { status: 201 })
}
