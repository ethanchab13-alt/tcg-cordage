import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

const CORDEUR_EMAIL = process.env.NEXT_PUBLIC_CORDEUR_EMAIL ?? 'ethanchab13@gmail.com'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Si c'est le cordeur, on le renvoie vers son espace
  const isCordeur =
    user.user_metadata?.role === 'cordeur' ||
    user.email === CORDEUR_EMAIL

  if (isCordeur) redirect('/cordeur/dashboard')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="client" fullName={fullName} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  )
}
