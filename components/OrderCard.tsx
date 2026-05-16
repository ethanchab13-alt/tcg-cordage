import type { StringingOrder } from '@/types/database'
import StatusBadge from './StatusBadge'

interface OrderCardProps {
  order: StringingOrder & { profiles?: { full_name: string | null; email: string } | null }
  showClient?: boolean   // true dans le dashboard cordeur
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function OrderCard({ order, showClient = false }: OrderCardProps) {
  const tensionLabel =
    order.tension_cross
      ? `${order.tension_mains} / ${order.tension_cross} kg`
      : `${order.tension_mains} kg`

  return (
    <article className="card flex flex-col gap-3">
      {/* En-tête : statut + date */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
          {showClient && order.profiles && (
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {order.profiles.full_name ?? order.profiles.email}
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Corps */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Field label="Cordage" value={order.string_type} />
        <Field label="Tension" value={tensionLabel} />
        {order.racket_brand && (
          <Field label="Raquette" value={order.racket_brand} />
        )}
        {order.price != null && (
          <Field label="Prix" value={`${order.price.toFixed(2)} €`} highlight />
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 leading-relaxed">
          💬 {order.notes}
        </p>
      )}

      {/* Raquette prête — message spécial */}
      {order.status === 'ready' && (
        <div className="rounded-lg bg-[#e8f5ef] border border-[#006341]/20 px-3 py-2 text-sm text-[#006341] font-medium">
          🎾 Votre raquette est prête ! Vous pouvez la récupérer au club.
        </div>
      )}
    </article>
  )
}

function Field({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`font-medium ${highlight ? 'text-[#006341]' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}
