import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let subscription: unknown
  try {
    subscription = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  // Valider la structure minimale de la subscription
  if (
    !subscription ||
    typeof subscription !== 'object' ||
    !('endpoint' in subscription) ||
    !('keys' in subscription)
  ) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 422 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: subscription })
    .eq('id', user.id)

  if (error) {
    console.error('[POST /api/push/subscribe]', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/push/subscribe — Se désabonner des notifications
 */
export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
