import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

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

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'cordeur') redirect('/cordeur/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="client" fullName={profile?.full_name ?? null} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  )
}
