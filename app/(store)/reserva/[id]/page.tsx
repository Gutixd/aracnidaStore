import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import {
  RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS,
  formatReservationDate,
} from '@/lib/reservations'
import { PICKUP_PLACE } from '@/lib/pickup'
import { CheckCircle2, Clock, Package, Truck, PackageCheck, CalendarDays, Landmark } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Estado de tu reserva',
  robots: { index: false, follow: false },
}

const TRANSFER_INFO = {
  banco: 'Banco Estado',
  tipo: 'Cuenta RUT',
  nombre: 'Diego Gutierrez',
  rut: '21.481.177-4',
}

async function getReservation(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .eq('is_reservation', true)
    .single()
  return data
}

export default async function ReservaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pago?: string }>
}) {
  const { id } = await params
  const { pago } = await searchParams
  const reservation = await getReservation(id)
  if (!reservation) notFound()

  const shortId = reservation.id.slice(0, 8).toUpperCase()
  const deposit = Number(reservation.deposit_amount ?? 0)
  const balance = Number(reservation.balance_due ?? 0)
  const esTransferencia = reservation.payment_method === 'transferencia'
  const abonoPagado = reservation.payment_status === 'abonado' || reservation.payment_status === 'pagado'

  const steps = [
    { key: 'pendiente', label: 'Reserva recibida', icon: <Clock size={16} /> },
    { key: 'confirmado', label: 'Confirmada', icon: <CheckCircle2 size={16} /> },
    { key: 'en_preparacion', label: 'En preparación', icon: <Package size={16} /> },
    { key: 'producto_recibido', label: 'Producto recibido', icon: <PackageCheck size={16} /> },
    { key: 'lista_entrega', label: 'Lista para entrega', icon: <Truck size={16} /> },
    { key: 'entregado', label: 'Entregada', icon: <CheckCircle2 size={16} /> },
  ]
  const currentIdx = steps.findIndex((s) => s.key === reservation.status)

  const banner = abonoPagado
    ? { bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)', color: '#15803d',
        text: '¡Abono confirmado! Ya estamos gestionando tu producto.' }
    : esTransferencia
      ? { bg: 'rgba(234,179,8,.1)', border: 'rgba(234,179,8,.3)', color: '#a16207',
          text: 'Tu reserva quedará confirmada apenas recibamos la transferencia.' }
      : pago === 'error'
        ? { bg: 'rgba(192,57,43,.1)', border: 'rgba(192,57,43,.3)', color: '#c0392b',
            text: 'El pago no se completó. Escríbenos por WhatsApp para retomarlo.' }
        : { bg: 'rgba(234,179,8,.1)', border: 'rgba(234,179,8,.3)', color: '#a16207',
            text: 'Tu pago está en proceso. Te avisaremos cuando se acredite.' }

  const sectionTitle = 'text-sm font-bold uppercase tracking-wider mb-5'
  const sectionStyle = { color: 'var(--gray-400)' }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }} className="animate-fade-in">
      <div className="max-w-2xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10 animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.25)' }}>
            <CalendarDays size={38} style={{ color: '#16a34a' }} />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--text)' }}>
            {abonoPagado ? '¡Reserva confirmada!' : 'Reserva registrada'}
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Gracias <strong style={{ color: 'var(--text)' }}>{reservation.customer_name}</strong>.
            Te avisaremos apenas tu producto llegue.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: '#fff', border: '1px solid var(--gray-100)' }}>
            <span className="text-xs" style={{ color: 'var(--gray-400)' }}>Reserva #</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{shortId}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${RESERVATION_STATUS_COLORS[reservation.status] ?? ''}`}>
              {RESERVATION_STATUS_LABELS[reservation.status] ?? reservation.status}
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-6 text-sm font-semibold text-center"
          style={{ background: banner.bg, border: `1px solid ${banner.border}`, color: banner.color }}>
          {banner.text}
        </div>

        {/* Datos para transferir, mientras el abono no esté confirmado */}
        {esTransferencia && !abonoPagado && (
          <div className="card p-6 mb-6" style={{ borderColor: 'rgba(234,179,8,.35)' }}>
            <h2 className={sectionTitle} style={sectionStyle}>
              <Landmark size={14} className="inline mr-1.5" />
              Datos para transferir
            </h2>
            <div className="space-y-2 text-sm">
              {[
                ['Banco', TRANSFER_INFO.banco],
                ['Tipo de cuenta', TRANSFER_INFO.tipo],
                ['Nombre', TRANSFER_INFO.nombre],
                ['RUT', TRANSFER_INFO.rut],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span style={{ color: 'var(--gray-600)' }}>{k}</span>
                  <span className="font-semibold text-right" style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
                <span className="font-bold" style={{ color: 'var(--text)' }}>Monto a transferir</span>
                <span className="font-black tabular-nums" style={{ color: '#15803d' }}>{formatPrice(deposit)}</span>
              </div>
            </div>
            <p className="text-xs mt-4 rounded-lg p-3" style={{ background: '#fff8e1', color: '#8a6d1a' }}>
              Envíanos el comprobante por WhatsApp indicando tu número de reserva <strong>#{shortId}</strong>.
              Tu reserva se confirma cuando verifiquemos el abono.
            </p>
          </div>
        )}

        {/* Línea de estado */}
        <div className="card p-6 mb-6">
          <h2 className={sectionTitle} style={sectionStyle}>Estado de la reserva</h2>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const done = currentIdx >= 0 && i <= currentIdx
              const isCancelled = reservation.status === 'cancelado'
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={done && !isCancelled
                      ? { background: 'rgba(22,163,74,.12)', color: '#15803d' }
                      : { background: 'var(--gray-50)', color: 'var(--gray-200)' }}>
                    {step.icon}
                  </span>
                  <span className="text-sm font-semibold"
                    style={{ color: done && !isCancelled ? 'var(--text)' : 'var(--gray-400)' }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
            {reservation.status === 'cancelado' && (
              <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>
                Esta reserva fue cancelada. Si crees que es un error, escríbenos.
              </p>
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="card p-6 mb-6">
          <h2 className={sectionTitle} style={sectionStyle}>Tu reserva</h2>

          <div className="space-y-3 mb-6">
            {reservation.items?.map((item: { id: string; product_name: string; size: string; quantity: number }) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span style={{ color: 'var(--gray-800)' }}>
                  {item.product_name} · Talla {item.size} × {item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--gray-50)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>Lo necesitas para el</p>
            <p className="font-bold capitalize" style={{ color: 'var(--text)' }}>
              {reservation.needed_by ? formatReservationDate(reservation.needed_by) : 'Por confirmar'}
            </p>
            <p className="text-xs mt-3" style={{ color: 'var(--gray-400)' }}>
              Reservada el {formatDate(reservation.created_at)}
            </p>
          </div>

          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5" style={{ color: 'var(--gray-600)' }}>Precio normal</td>
                <td className="py-1.5 text-right tabular-nums" style={{ color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                  {formatPrice(reservation.subtotal)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5" style={{ color: 'var(--gray-600)' }}>Descuento por reservar (15%)</td>
                <td className="py-1.5 text-right tabular-nums font-semibold" style={{ color: '#15803d' }}>
                  −{formatPrice(reservation.discount)}
                </td>
              </tr>
              <tr>
                <td className="pt-3 font-bold" style={{ color: 'var(--text)', borderTop: '1px solid var(--gray-100)' }}>Total con descuento</td>
                <td className="pt-3 text-right font-black tabular-nums" style={{ color: 'var(--text)', borderTop: '1px solid var(--gray-100)' }}>
                  {formatPrice(reservation.total)}
                </td>
              </tr>
              <tr>
                <td className="pt-3 font-bold" style={{ color: '#15803d', borderTop: '2px solid var(--text)' }}>
                  Abono {abonoPagado ? 'pagado' : 'a pagar'} (50%)
                </td>
                <td className="pt-3 text-right font-black tabular-nums text-lg" style={{ color: '#15803d', borderTop: '2px solid var(--text)' }}>
                  {formatPrice(deposit)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold" style={{ color: '#b45309' }}>Saldo contra entrega</td>
                <td className="py-1.5 text-right font-bold tabular-nums" style={{ color: '#b45309' }}>
                  {formatPrice(balance)}
                </td>
              </tr>
              <tr>
                <td className="pt-3 text-xs" style={{ color: 'var(--gray-400)' }}>Método de pago</td>
                <td className="pt-3 text-right text-xs" style={{ color: 'var(--gray-600)' }}>
                  {PAYMENT_METHOD_LABELS[reservation.payment_method ?? ''] ?? reservation.payment_method ?? '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card p-6 mb-8">
          <h2 className={sectionTitle} style={sectionStyle}>Entrega</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
            Cuando tu producto llegue te contactamos para coordinar cómo lo prefieres:{' '}
            <strong style={{ color: 'var(--text)' }}>envío a domicilio</strong> o{' '}
            <strong style={{ color: 'var(--text)' }}>retiro gratis en {PICKUP_PLACE}</strong>.
            El saldo de {formatPrice(balance)} se paga en ese momento.
          </p>
        </div>

        <div className="text-center space-y-3">
          <a
            href={`https://wa.me/56978829942?text=${encodeURIComponent(`Hola! Consulta sobre mi reserva #${shortId}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex justify-center py-3 px-6"
          >
            Escribirnos por WhatsApp
          </a>
          <div>
            <Link href="/products" className="text-sm hover:underline" style={{ color: 'var(--gray-600)' }}>
              Seguir viendo el catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
