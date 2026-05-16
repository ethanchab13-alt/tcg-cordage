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

  // Vérifier que c'est bien un client (pas un cordeur)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
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

  // Insérer la commande
  const { data: order, error: insertError } = await supabase
    .from('stringing_orders')
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
    const { data: cordeurs } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, push_subscription')
      .eq('role', 'cordeur')

    if (cordeurs && cordeurs.length > 0) {
      // Récupérer le profil client pour personnaliser la notif
      const { data: clientProfile } = await adminSupabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const orderWithClientName = {
        ...order!,
        // On surcharge string_type pour afficher le nom du client dans la notif push
      }

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
