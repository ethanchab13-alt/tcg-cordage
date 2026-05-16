'use client'

import { useEffect, useState } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscribeButton() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [loading, setLoading]       = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  // ── Enregistrer le Service Worker au montage ────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Vérifier le support Web Push
    if (!('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    // Enregistrer le SW
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        // Vérifier si déjà abonné
        const existingSub = await registration.pushManager.getSubscription()
        if (existingSub) {
          setSubscribed(true)
          setPermission('granted')
        } else {
          setPermission(Notification.permission as PermissionState)
        }
      })
      .catch((err) => {
        console.error('[SW] Erreur enregistrement:', err)
      })
  }, [])

  async function handleSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready

      // Demander la permission si pas encore accordée
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      // Créer la subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      })

      // Envoyer au serveur
      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(subscription.toJSON()),
      })

      if (res.ok) {
        setSubscribed(true)
      } else {
        console.error('[Push] Erreur sauvegarde subscription')
      }
    } catch (err) {
      console.error('[Push] Erreur abonnement:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setSubscribed(false)
      setPermission('default')
    } catch (err) {
      console.error('[Push] Erreur désabonnement:', err)
    } finally {
      setLoading(false)
    }
  }

  // Ne rien afficher si non supporté ou déjà refusé définitivement
  if (permission === 'unsupported') return null
  if (permission === 'denied') {
    return (
      <p className="text-xs text-gray-400 text-center py-1">
        Notifications bloquées par le navigateur.{' '}
        <a
          href="https://support.google.com/chrome/answer/3220216"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Comment les autoriser ?
        </a>
      </p>
    )
  }

  if (subscribed) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-[#e8f5ef] px-3 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-[#006341] font-medium">
          <BellIcon filled />
          Notifications activées
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Désactiver
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="btn-secondary w-full flex items-center justify-center gap-2"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner /> Activation…
        </span>
      ) : (
        <>
          <BellIcon />
          Activer les notifications push
        </>
      )}
    </button>
  )
}

function BellIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
