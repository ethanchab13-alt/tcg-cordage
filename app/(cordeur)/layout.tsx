import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'

export default async function CordeurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Vérification du rôle via user_metadata (pas de DB query, pas de RLS)
  const isCordeur =
    user.user_metadata?.role === 'cordeur' ||
    user.email === CORDEUR_EMAIL

  if (!isCordeur) redirect('/dashboard')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="cordeur" fullName={fullName} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
