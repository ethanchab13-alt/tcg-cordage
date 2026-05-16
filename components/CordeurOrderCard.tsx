'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import type { StringingOrder, OrderStatus } from '@/types/database'

type OrderWithClient = StringingOrder & {
  profiles?: { full_name: string | null; email: string } | null
}

interface Props {
  order: OrderWithClient
  onUpdated: (updated: OrderWithClient) => void
}

// Libellé et couleur du bouton d'avancement
const NEXT_ACTION: Record<
  Exclude<OrderStatus, 'delivered'>,
  { label: string; nextStatus: OrderStatus; className: string }
> = {
  pending:     { label: 'Commencer',      nextStatus: 'in_progress', className: 'bg-blue-500 hover:bg-blue-600' },
  in_progress: { label: '✓ Marquer prête', nextStatus: 'ready',       className: 'bg-[#006341] hover:bg-[#004d32]' },
  ready:       { label: 'Marquer livrée', nextStatus: 'delivered',    className: 'bg-gray-500 hover:bg-gray-600' },
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function CordeurOrderCard({ order, onUpdated }: Props) {
  const [loading, setLoading]   = useState(false)
  const [price, setPrice]       = useState(order.price?.toString() ?? '')
  const [editPrice, setEditPrice] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const clientName =
    order.profiles?.full_name ?? order.profiles?.email ?? 'Client inconnu'

  const tensionLabel = order.tension_cross
    ? `${order.tension_mains} / ${order.tension_cross} kg`
    : `${order.tension_mains} kg`

  async function advanceStatus() {
    if (order.status === 'delivered') return
    setLoading(true)
    setError(null)

    const action = NEXT_ACTION[order.status as Exclude<OrderStatus, 'delivered'>]

    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: action.nextStatus,
        price: price ? parseFloat(price) : null,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Erreur lors de la mise à jour')
      setLoading(false)
      return
    }

    setLoading(false)
    setEditPrice(false)
    onUpdated(json.order as OrderWithClient)
  }

  const isDone = order.status === 'delivered'
  const action = isDone
    ? null
    : NEXT_ACTION[order.status as Exclude<OrderStatus, 'delivered'>]

  return (
    <article className={`card flex flex-col gap-3 ${order.status === 'ready' ? 'border-[#006341]/40 bg-[#f7fcfa]' : ''}`}>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{clientName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Field label="Cordage"   value={order.string_type} />
        <Field label="Tension"   value={tensionLabel} />
        {order.racket_brand && (
          <Field label="Raquette" value={order.racket_brand} />
        )}
      </div>

      {/* Notes client */}
      {order.notes && (
        <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 leading-relaxed">
          💬 {order.notes}
        </p>
      )}

      {/* Prix */}
      {!isDone && (
        <div className="border-t border-gray-100 pt-2">
          {editPrice ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Prix (€)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ex : 18.00"
                className="form-input text-sm py-1.5 w-28"
                autoFocus
              />
              <button
                onClick={() => setEditPrice(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditPrice(true)}
              className="text-xs text-[#006341] hover:underline"
            >
              {price ? `Prix : ${parseFloat(price).toFixed(2)} €  ✏️` : '+ Ajouter un prix'}
            </button>
          )}
        </div>
      )}

      {/* Prix final (commande livrée) */}
      {isDone && order.price != null && (
        <p className="text-sm font-semibold text-[#006341] border-t border-gray-100 pt-2">
          Prix facturé : {order.price.toFixed(2)} €
        </p>
      )}

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      {/* Bouton d'action */}
      {action && (
        <button
          onClick={advanceStatus}
          disabled={loading}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white
                      transition-colors ${action.className}
                      disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Mise à jour…
            </span>
          ) : (
            action.label
          )}
        </button>
      )}
    </article>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
