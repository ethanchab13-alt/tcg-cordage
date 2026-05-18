import { createAdminClient } from '@/lib/supabase/server'
import CordeurDashboard from './CordeurDashboard'

export const dynamic = 'force-dynamic'

export default async function CordeurDashboardPage() {
  // Admin client : bypass RLS pour que le cordeur voit toutes les commandes
  const supabase = createAdminClient()

  // Charger les commandes actives (non livrées) avec infos client
  const { data: orders } = await supabase
    .from('stringing_orders')
    .select('*, profiles(full_name, email)')
    .neq('status', 'delivered')
    .order('created_at', { ascending: true })   // FIFO : les plus anciennes en premier

  return <CordeurDashboard initialOrders={orders ?? []} />
}
