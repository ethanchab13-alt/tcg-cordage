import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

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

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'cordeur') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="cordeur" fullName={profile.full_name} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
