import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import OrderCard from '@/components/OrderCard'
import type { OrderStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<OrderStatus | 'all', string> = {
  all:         'Toutes',
  pending:     'En attente',
  in_progress: 'En cours',
  ready:       'Prêtes',
  delivered:   'Récupérées',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function OrdersHistoryPage({ searchParams }: Props) {
  const { status: rawStatus } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin client pour bypasser les RLS sur le SELECT
  const admin = createAdminClient()

  // Construire la requête selon le filtre
  let query = admin
    .from('stringing_orders')
    .select('*')
    .eq('client_id', user!.id)
    .order('created_at', { ascending: false })

  const validStatuses: OrderStatus[] = ['pending', 'in_progress', 'ready', 'delivered']
  if (rawStatus && validStatuses.includes(rawStatus as OrderStatus)) {
    query = query.eq('status', rawStatus as OrderStatus)
  }

  const { data: orders } = await query

  const activeFilter: OrderStatus | 'all' = (validStatuses.includes(rawStatus as OrderStatus) ? rawStatus as OrderStatus : 'all')

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-[#006341] transition-colors"
          aria-label="Retour"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(STATUS_LABELS) as Array<OrderStatus | 'all'>).map((s) => (
          <FilterTab
            key={s}
            href={s === 'all' ? '/orders' : `/orders?status=${s}`}
            active={activeFilter === s || (s === 'all' && !validStatuses.includes(activeFilter as OrderStatus))}
            label={STATUS_LABELS[s]}
          />
        ))}
      </div>

      {/* Liste */}
      {orders && orders.length > 0 ? (
        <section className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      ) : (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-medium text-gray-600">Aucune commande trouvée</p>
          {activeFilter !== 'all' && (
            <Link href="/orders" className="mt-2 text-xs text-[#006341] hover:underline block">
              Voir toutes les commandes
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function FilterTab({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
        ${
          active
            ? 'bg-[#006341] text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-[#006341] hover:text-[#006341]'
        }`}
    >
      {label}
    </Link>
  )
}
