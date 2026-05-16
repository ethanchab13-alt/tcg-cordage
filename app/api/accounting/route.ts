import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StringingOrder } from '@/types/database'

export async function GET() {
  const supabase = await createClient()

  // Vérifier que c'est le cordeur
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null

  if (!profile || profile.role !== 'cordeur') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // ── Récupérer toutes les commandes livrées ────────────────────
  const { data: orders, error } = await supabase
    .from('stringing_orders')
    .select('id, string_type, tension_mains, tension_cross, price, delivered_at, created_at, profiles(full_name, email)')
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }

  const deliveredOrders = (orders ?? []) as unknown as StringingOrder[]

  // ── KPIs globaux ─────────────────────────────────────────────
  const ordersWithPrice  = deliveredOrders.filter((o) => o.price != null)
  const totalRevenue     = ordersWithPrice.reduce((sum, o) => sum + (o.price ?? 0), 0)
  const totalOrders      = deliveredOrders.length
  const avgPrice         = ordersWithPrice.length > 0 ? totalRevenue / ordersWithPrice.length : 0
  const ordersWithoutPrice = deliveredOrders.filter((o) => o.price == null).length

  // ── Breakdown mensuel (12 derniers mois) ──────────────────────
  const now       = new Date()
  const monthly: Record<string, { revenue: number; count: number }> = {}

  for (let i = 11; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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

  const monthlyData = Object.entries(monthly).map(([month, data]) => ({
    month,
    ...data,
  }))

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

  // ── Mois courant ─────────────────────────────────────────────
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonth    = monthly[currentMonthKey] ?? { revenue: 0, count: 0 }

  return NextResponse.json({
    kpis: {
      totalRevenue:      Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgPrice:          Math.round(avgPrice * 100) / 100,
      ordersWithoutPrice,
      currentMonthRevenue: Math.round(currentMonth.revenue * 100) / 100,
      currentMonthOrders:  currentMonth.count,
    },
    monthlyData,
    topStrings,
    recentOrders: deliveredOrders.slice(0, 50),
  })
}
