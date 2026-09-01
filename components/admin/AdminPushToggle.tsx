'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/actions/push'

type Status = 'checking' | 'unsupported' | 'off' | 'denied' | 'on' | 'loading'

/**
 * Activa/desactiva las notificaciones push de pedido nuevo en ESTE navegador.
 * Cada dispositivo/navegador se suscribe por separado — si el dueño usa el
 * panel desde el celular y el computador, activa en ambos por separado.
 */
export function AdminPushToggle() {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setStatus(existing ? 'on' : 'off')
    })
  }, [])

  async function handleEnable() {
    setError(null)
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        setError('Notificaciones no configuradas todavía.')
        setStatus('off')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const result = await subscribeToPush(json, navigator.userAgent)
      if (result.error) {
        setError(result.error)
        setStatus('off')
        return
      }
      setStatus('on')
    } catch {
      setError('No se pudo activar. Intenta de nuevo.')
      setStatus('off')
    }
  }

  async function handleDisable() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await unsubscribeFromPush(sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('off')
    } catch {
      setStatus('on')
    }
  }

  if (status === 'checking') return null

  if (status === 'unsupported') {
    return (
      <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
        Este navegador no soporta notificaciones push. Funciona en Chrome/Edge para Android y computador.
      </p>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: status === 'on' ? 'rgba(21,128,61,.1)' : 'var(--gray-50)' }}
        >
          {status === 'on' ? (
            <BellRing size={18} style={{ color: '#15803d' }} />
          ) : (
            <Bell size={18} style={{ color: 'var(--gray-400)' }} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Notificaciones de pedido nuevo</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
            {status === 'on' && 'Activas en este navegador.'}
            {status === 'off' && 'Recibe un aviso al instante cuando entra un pedido, aunque el panel esté cerrado.'}
            {status === 'denied' && 'Bloqueaste el permiso de notificaciones para este sitio. Actívalo desde los ajustes del navegador (ícono de candado junto a la URL) para poder encenderlas aquí.'}
          </p>
          {error && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{error}</p>}
        </div>
        {status !== 'denied' && (
          <button
            onClick={status === 'on' ? handleDisable : handleEnable}
            disabled={status === 'loading'}
            className={status === 'on' ? 'btn-ghost text-xs py-2 px-3' : 'btn-primary text-xs py-2 px-3'}
          >
            {status === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : status === 'on' ? (
              <><BellOff size={14} /> Desactivar</>
            ) : (
              <><Bell size={14} /> Activar</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// El navegador exige la clave VAPID en este formato binario específico, no
// como el string base64 que se genera y se guarda en la variable de entorno.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
