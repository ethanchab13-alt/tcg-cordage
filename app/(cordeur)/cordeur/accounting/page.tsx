import { createClient } from '@/lib/supabase/server'
import type { StringingOrder } from '@/types/database'

type OrderWithProfile = StringingOrder & {
  profiles?: { full_name: string | null; email: string } | null
}
import AccountingClient from './AccountingClient'

export const dynamic = 'force-dynamic'

export default async function AccountingPage() {
  const supabase = await createClient()

  // Récupérer les données directement côté serveur (pas besoin de passer par l'API)
  const { data: orders } = await supabase
    .from('stringing_orders')
    .select('id, string_type, tension_mains, tension_cross, racket_brand, price, delivered_at, created_at, profiles(full_name, email)')
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })

  const deliveredOrders = (orders ?? []) as unknown as OrderWithProfile[]

  // ── Calculs KPIs ─────────────────────────────────────────────
  const ordersWithPrice   = deliveredOrders.filter((o) => o.price != null)
  const totalRevenue      = ordersWithPrice.reduce((sum, o) => sum + (o.price ?? 0), 0)
  const totalOrders       = deliveredOrders.length
  const avgPrice          = ordersWithPrice.length > 0 ? totalRevenue / ordersWithPrice.length : 0
  const ordersWithoutPrice = deliveredOrders.filter((o) => o.price == null).length

  // Mois courant
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let currentMonthRevenue = 0
  let currentMonthOrders  = 0

  // ── Breakdown mensuel (12 derniers mois) ──────────────────────
  const monthly: Record<string, { revenue: number; count: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = { revenue: 0, count: 0 }
  }

  for (const order of deliveredOrders) {
    const dateStr = order.delivered_at ?? order.created_at
    const d       = new Date(dateStr)
    const key     = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthly[key]) {
      monthly[key].count   += 1
      monthly[key].revenue += order.price ?? 0
    }
  }

  if (monthly[currentMonthKey]) {
    currentMonthRevenue = monthly[currentMonthKey].revenue
    currentMonthOrders  = monthly[currentMonthKey].count
  }

  const monthlyData = Object.entries(monthly).map(([month, data]) => ({ month, ...data }))

  // ── Top cordages ─────────────────────────────────────────────
  const stringCount: Record<string, { count: number; revenue: number }> = {}
  for (const order of deliveredOrders) {
    const key = order.string_type
    if (!stringCount[key]) stringCount[key] = { count: 0, revenue: 0 }
    stringCount[key].count   += 1
    stringCount[key].revenue += order.price ?? 0
  }
  const topStrings = Object.entries(stringCount)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <AccountingClient
      kpis={{
        totalRevenue:        Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgPrice:            Math.round(avgPrice * 100) / 100,
        ordersWithoutPrice,
        currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
        currentMonthOrders,
      }}
      monthlyData={monthlyData}
      topStrings={topStrings}
      recentOrders={deliveredOrders.slice(0, 100)}
    />
  )
}
