// ============================================================
// TCG Stringing — Service Worker
// Gère les Web Push notifications et le cache PWA
// ============================================================

const CACHE_NAME = 'tcg-stringing-v1'

// ── Installation : ne rien mettre en cache pour l'instant ──
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// ── Activation : prendre le contrôle immédiatement ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Supprimer les anciens caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
    ])
  )
})

// ── Réception d'une notification push ──
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'TCG Cordage',
      body: event.data.text(),
      url: '/',
    }
  }

  const { title, body, url, icon, badge } = payload

  const options = {
    body: body ?? 'Nouvelle notification',
    icon: icon ?? '/icons/icon-192.png',
    badge: badge ?? '/icons/icon-72.png',
    data: { url: url ?? '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    // Actions rapides selon le type de notif
    actions: payload.actions ?? [],
  }

  event.waitUntil(
    self.registration.showNotification(title ?? 'TCG Cordage', options)
  )
})

// ── Clic sur la notification ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre de l'app est déjà ouverte, la focaliser
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// ── Fermeture de la notification ──
self.addEventListener('notificationclose', () => {
  // Optionnel : tracker les fermetures
})
