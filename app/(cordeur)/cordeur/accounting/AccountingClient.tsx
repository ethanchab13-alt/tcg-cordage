'use client'

import { useState } from 'react'
import StatCard from '@/components/StatCard'
import RevenueBarChart from '@/components/RevenueBarChart'

interface MonthData  { month: string; revenue: number; count: number }
interface TopString  { name: string; count: number; revenue: number }
interface OrderRow   {
  id: string
  string_type: string
  tension_mains: number
  tension_cross: number | null
  racket_brand: string | null
  price: number | null
  delivered_at: string | null
  created_at: string
  profiles?: { full_name: string | null; email: string } | null
}
interface Kpis {
  totalRevenue: number
  totalOrders: number
  avgPrice: number
  ordersWithoutPrice: number
  currentMonthRevenue: number
  currentMonthOrders: number
}

interface Props {
  kpis: Kpis
  monthlyData: MonthData[]
  topStrings: TopString[]
  recentOrders: OrderRow[]
}

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function formatMonthLabel(key: string) {
  const [year, m] = key.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${year}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

export default function AccountingClient({ kpis, monthlyData, topStrings, recentOrders }: Props) {
  const [search, setSearch]         = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('all')

  // Filtres du tableau
  const filteredOrders = recentOrders.filter((o) => {
    const clientName = (o.profiles?.full_name ?? o.profiles?.email ?? '').toLowerCase()
    const matchSearch = search === '' || clientName.includes(search.toLowerCase()) ||
                        o.string_type.toLowerCase().includes(search.toLowerCase())

    const dateStr = o.delivered_at ?? o.created_at
    const key     = `${new Date(dateStr).getFullYear()}-${String(new Date(dateStr).getMonth() + 1).padStart(2, '0')}`
    const matchMonth = filterMonth === 'all' || key === filterMonth

    return matchSearch && matchMonth
  })

  // Calcul du total filtré
  const filteredRevenue = filteredOrders
    .filter((o) => o.price != null)
    .reduce((sum, o) => sum + (o.price ?? 0), 0)

  // Mois disponibles pour le filtre
  const availableMonths = Array.from(
    new Set(
      recentOrders.map((o) => {
        const d = new Date(o.delivered_at ?? o.created_at)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    )
  ).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Comptabilité</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suivi des revenus de cordage</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="CA ce mois"
          value={`${kpis.currentMonthRevenue.toFixed(2)} €`}
          sub={`${kpis.currentMonthOrders} cordage${kpis.currentMonthOrders > 1 ? 's' : ''}`}
          highlight
          icon={<CalendarIcon />}
        />
        <StatCard
          label="CA total"
          value={`${kpis.totalRevenue.toFixed(2)} €`}
          sub={`${kpis.totalOrders} cordages au total`}
          icon={<EuroIcon />}
        />
        <StatCard
          label="Prix moyen"
          value={kpis.avgPrice > 0 ? `${kpis.avgPrice.toFixed(2)} €` : '—'}
          sub="par cordage facturé"
          icon={<ChartIcon />}
        />
      </div>

      {/* Alerte commandes sans prix */}
      {kpis.ordersWithoutPrice > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 flex items-start gap-2">
          <span className="text-lg leading-none">⚠️</span>
          <span>
            <strong>{kpis.ordersWithoutPrice} commande{kpis.ordersWithoutPrice > 1 ? 's' : ''}</strong> livrée{kpis.ordersWithoutPrice > 1 ? 's' : ''} sans prix renseigné.{' '}
            Pensez à saisir les prix depuis le dashboard ou l'historique.
          </span>
        </div>
      )}

      {/* Graphique mensuel */}
      <RevenueBarChart data={monthlyData} />

      {/* Top cordages */}
      {topStrings.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top cordages</h3>
          <div className="space-y-2">
            {topStrings.map((s, i) => {
              const maxCount = topStrings[0].count
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{s.name}</span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">
                        ×{s.count} · {s.revenue > 0 ? `${s.revenue.toFixed(0)} €` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006341] rounded-full transition-all duration-500"
                        style={{ width: `${(s.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tableau des commandes */}
      <div className="card space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Détail des commandes
            {filteredOrders.length !== recentOrders.length && (
              <span className="ml-2 font-normal text-gray-400">
                ({filteredOrders.length} affiché{filteredOrders.length > 1 ? 's' : ''} · {filteredRevenue.toFixed(2)} €)
              </span>
            )}
          </h3>

          {/* Filtres */}
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Chercher client, cordage…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-xs py-1.5 flex-1 sm:w-44"
            />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="form-input text-xs py-1.5 w-36"
            >
              <option value="all">Tous les mois</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table desktop */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-3">Cordage</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-3">Tension</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Prix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(order.delivered_at)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-gray-800 max-w-[120px] truncate">
                      {order.profiles?.full_name ?? order.profiles?.email ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-600 max-w-[160px] truncate">
                      {order.string_type}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">
                      {order.tension_cross
                        ? `${order.tension_mains}/${order.tension_cross} kg`
                        : `${order.tension_mains} kg`}
                    </td>
                    <td className="py-2.5 text-right">
                      {order.price != null ? (
                        <span className="font-semibold text-[#006341]">
                          {order.price.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                          À saisir
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total visible */}
        {filteredOrders.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <div className="text-sm">
              <span className="text-gray-500">Total affiché : </span>
              <span className="font-bold text-[#006341]">{filteredRevenue.toFixed(2)} €</span>
              <span className="text-gray-400 ml-1">
                ({filteredOrders.filter((o) => o.price != null).length}/{filteredOrders.length} facturés)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Icônes inline ─────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function EuroIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
