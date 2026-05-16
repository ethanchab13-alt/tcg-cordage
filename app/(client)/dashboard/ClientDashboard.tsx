'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import OrderForm from '@/components/OrderForm'
import OrderCard from '@/components/OrderCard'
import PushSubscribeButton from '@/components/PushSubscribeButton'
import type { StringingOrder } from '@/types/database'

interface Props {
  userId: string
  initialOrders: StringingOrder[]
}

export default function ClientDashboard({ userId, initialOrders }: Props) {
  const supabase = createClient()
  const [orders, setOrders] = useState<StringingOrder[]>(initialOrders)
  const [newReadyId, setNewReadyId] = useState<string | null>(null)

  // ── Supabase Realtime : écouter les changements sur ses commandes ──
  useEffect(() => {
    const channel = supabase
      .channel('client-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stringing_orders',
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as StringingOrder
            // N'afficher sur le dashboard que les commandes non livrées
            if (newOrder.status !== 'delivered') {
              setOrders((prev) => [newOrder, ...prev])
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as StringingOrder
            setOrders((prev) => {
              // Si la commande passe à "delivered", la retirer de la liste active
              if (updated.status === 'delivered') {
                return prev.filter((o) => o.id !== updated.id)
              }
              return prev.map((o) => (o.id === updated.id ? updated : o))
            })

            // Notifier visuellement si la raquette est prête
            if (updated.status === 'ready') {
              setNewReadyId(updated.id)
              setTimeout(() => setNewReadyId(null), 5000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  function handleOrderCreated(order: StringingOrder) {
    setOrders((prev) => [order, ...prev])
  }

  const activeOrders = orders.filter((o) => o.status !== 'delivered')

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes raquettes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Suivez l&apos;avancement de votre cordage en temps réel.
        </p>
      </div>

      {/* Notifications push */}
      <PushSubscribeButton />

      {/* Formulaire de dépôt */}
      <OrderForm onOrderCreated={handleOrderCreated} />

      {/* Notification "raquette prête" */}
      {newReadyId && (
        <div className="rounded-xl bg-[#006341] text-white px-4 py-3 flex items-center gap-3 shadow-lg animate-bounce-once">
          <span className="text-2xl">🎾</span>
          <div>
            <p className="font-semibold text-sm">Votre raquette est prête !</p>
            <p className="text-xs opacity-80">Vous pouvez la récupérer au club.</p>
          </div>
        </div>
      )}

      {/* Commandes en cours */}
      {activeOrders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            En cours ({activeOrders.length})
          </h2>
          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      ) : (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">🎾</p>
          <p className="text-sm font-medium text-gray-600">Aucune commande en cours</p>
          <p className="text-xs text-gray-400 mt-1">
            Cliquez sur &quot;Déposer une raquette&quot; pour commencer
          </p>
        </div>
      )}

      {/* Lien vers l'historique */}
      <Link
        href="/orders"
        className="flex items-center justify-center gap-1.5 text-sm text-[#006341] hover:underline py-2"
      >
        Voir l&apos;historique complet
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}
