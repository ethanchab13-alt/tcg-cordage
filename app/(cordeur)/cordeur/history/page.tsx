import { createAdminClient } from '@/lib/supabase/server'
import CordeurOrderCard from '@/components/CordeurOrderCard'
import type { StringingOrder } from '@/types/database'

type OrderWithClient = StringingOrder & {
  profiles?: { full_name: string | null; email: string } | null
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 20

export default async function CordeurHistoryPage({ searchParams }: Props) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const supabase = createAdminClient()

  const { data: rawOrders, count } = await supabase
    .from('stringing_orders')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })
    .range(from, to)

  const orders = (rawOrders ?? []) as OrderWithClient[]

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {count ?? 0} cordage{(count ?? 0) > 1 ? 's' : ''} terminé{(count ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille */}
      {orders.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <CordeurOrderCard
                key={order.id}
                order={order}
                onUpdated={() => {}}   // historique = lecture seule
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination current={page} total={totalPages} />
          )}
        </>
      ) : (
        <div className="card text-center py-14">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-medium text-gray-600">
            Aucune raquette livrée pour l&apos;instant.
          </p>
        </div>
      )}
    </div>
  )
}

function Pagination({ current, total }: { current: number; total: number }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1)

  return (
    <nav className="flex justify-center gap-1.5 pt-2">
      {pages.map((p) => (
        <a
          key={p}
          href={`/cordeur/history?page=${p}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors
            ${
              p === current
                ? 'bg-[#006341] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#006341] hover:text-[#006341]'
            }`}
        >
          {p}
        </a>
      ))}
    </nav>
  )
}
