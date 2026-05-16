import { createClient } from '@/lib/supabase/server'
import ClientDashboard from './ClientDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Charger les commandes actives (non livrées) côté serveur pour le premier rendu
  const { data: orders } = await supabase
    .from('stringing_orders')
    .select('*')
    .eq('client_id', user!.id)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })

  return (
    <ClientDashboard
      userId={user!.id}
      initialOrders={orders ?? []}
    />
  )
}
