import { createClient } from '@/lib/supabase/server'
import CordeurDashboard from './CordeurDashboard'

export const dynamic = 'force-dynamic'

export default async function CordeurDashboardPage() {
  const supabase = await createClient()

  // Charger les commandes actives (non livrées) avec infos client
  const { data: orders } = await supabase
    .from('stringing_orders')
    .select('*, profiles(full_name, email)')
    .neq('status', 'delivered')
    .order('created_at', { ascending: true })   // FIFO : les plus anciennes en premier

  return <CordeurDashboard initialOrders={orders ?? []} />
}
