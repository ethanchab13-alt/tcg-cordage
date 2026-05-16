import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'

export default async function RootPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Utiliser user_metadata (pas de RLS, pas de DB query)
  const metaRole = user.user_metadata?.role as string | undefined
  const isCordeur = metaRole === 'cordeur' || user.email === CORDEUR_EMAIL

  if (isCordeur) {
    redirect('/cordeur/dashboard')
  }

  redirect('/dashboard')
}
