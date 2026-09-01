// Service worker del panel de admin. Vive fuera de /admin a propósito (en la
// raíz de public/) porque el alcance de un service worker nunca puede ser más
// amplio que la carpeta donde el archivo se sirve — si estuviera dentro de
// /admin, no podría cubrir /admin/orders, /admin/products, etc.
//
// Solo hace dos cosas: mostrar la notificación que llega por push, y abrir
// el panel al hacer clic en ella. No cachea nada — no es necesario para el
// caso de uso (recibir avisos), y evita el riesgo de servir contenido viejo.

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'AracnidaStore', body: event.data.text() }
  }

  const title = payload.title || 'AracnidaStore'
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url || '/admin/orders' },
    tag: payload.tag || 'aracnida-order',
    // Un pedido nuevo no debería perderse entre otras notificaciones del
    // mismo tipo mientras el dueño no ha mirado el celular.
    renotify: true,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/orders'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si el panel ya está abierto en alguna pestaña, la enfoca en vez de
      // abrir una nueva.
      for (const client of clients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
