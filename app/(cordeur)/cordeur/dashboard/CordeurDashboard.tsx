'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CordeurOrderCard from '@/components/CordeurOrderCard'
import PushSubscribeButton from '@/components/PushSubscribeButton'
import type { StringingOrder } from '@/types/database'

type OrderWithClient = StringingOrder & {
  profiles?: { full_name: string | null; email: string } | null
}

interface Props {
  initialOrders: OrderWithClient[]
}

// Ordre d'affichage des statuts dans le dashboard
const STATUS_ORDER = ['pending', 'in_progress', 'ready'] as const

const STATUS_SECTION_LABELS = {
  pending:     { label: 'En attente',  color: 'text-yellow-700', dot: 'bg-yellow-400' },
  in_progress: { label: 'En cours',    color: 'text-blue-700',   dot: 'bg-blue-400'   },
  ready:       { label: 'Prêtes',      color: 'text-green-700',  dot: 'bg-[#006341]'  },
}

export default function CordeurDashboard({ initialOrders }: Props) {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithClient[]>(initialOrders)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)

  // ── Realtime : écouter TOUTES les commandes actives ──────────────
  useEffect(() => {
    const channel = supabase
      .channel('cordeur-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stringing_orders',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as StringingOrder

            // Récupérer le profil client pour l'afficher
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', newOrder.client_id)
              .single()

            const orderWithClient: OrderWithClient = {
              ...newOrder,
              profiles: profile,
            }

            setOrders((prev) => [...prev, orderWithClient])
            setNewOrderId(newOrder.id)
            setTimeout(() => setNewOrderId(null), 4000)
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as StringingOrder
            setOrders((prev) => {
              // Retirer la commande si elle est livrée
              if (updated.status === 'delivered') {
                return prev.filter((o) => o.id !== updated.id)
              }
              return prev.map((o) =>
                o.id === updated.id
                  ? { ...o, ...updated }
                  : o
              )
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  function handleUpdated(updated: OrderWithClient) {
    if (updated.status === 'delivered') {
      setOrders((prev) => prev.filter((o) => o.id !== updated.id))
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      )
    }
  }

  // Grouper par statut
  const byStatus = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s)
      return acc
    },
    {} as Record<string, OrderWithClient[]>
  )

  const totalActive = orders.length

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Cordeur</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalActive === 0
              ? 'Aucune raquette en attente'
              : `${totalActive} raquette${totalActive > 1 ? 's' : ''} en cours`}
          </p>
        </div>

        {/* Bouton notifications + indicateur live */}
        <div className="flex flex-col items-end gap-2">
        <PushSubscribeButton />
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Temps réel
        </div>
        </div>
      </div>

      {/* Notification nouvelle commande */}
      {newOrderId && (
        <div className="rounded-xl bg-[#006341] text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-semibold text-sm">Nouvelle demande de cordage !</p>
            <p className="text-xs opacity-80">Un client vient de déposer une raquette.</p>
          </div>
        </div>
      )}

      {/* Sections par statut */}
      {totalActive === 0 ? (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-medium text-gray-600">Tout est à jour !</p>
          <p className="text-xs text-gray-400 mt-1">Aucune raquette en attente de cordage.</p>
        </div>
      ) : (
        STATUS_ORDER.map((status) => {
          const section = byStatus[status]
          if (section.length === 0) return null
          const cfg = STATUS_SECTION_LABELS[status]

          return (
            <section key={status} className="space-y-3">
              {/* Titre de section */}
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${cfg.color}`}>
                  {cfg.label}
                  <span className="ml-1.5 font-normal text-gray-400">
                    ({section.length})
                  </span>
                </h2>
              </div>

              {/* Grille responsive : 1 col mobile, 2 col desktop */}
              <div className="grid gap-3 sm:grid-cols-2">
                {section.map((order) => (
                  <CordeurOrderCard
                    key={order.id}
                    order={order}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
