import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { CheckCircle2, Package, Truck, MapPin, Clock, Store } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getOrder(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single()
  return data
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pago?: string }>
}) {
  const { id } = await params
  const { pago } = await searchParams
  const order = await getOrder(id)
  if (!order) notFound()

  const paymentBanner =
    order.payment_status === 'pagado' || pago === 'ok'
      ? { bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)', color: '#15803d', text: 'Pago confirmado. ¡Ya estamos preparando tu pedido!' }
      : pago === 'pendiente' || order.payment_status === 'pendiente'
        ? { bg: 'rgba(234,179,8,.1)', border: 'rgba(234,179,8,.3)', color: '#a16207', text: 'Tu pago está en proceso. Te avisaremos cuando se acredite.' }
        : pago === 'error' || order.payment_status === 'rechazado'
          ? { bg: 'rgba(192,57,43,.1)', border: 'rgba(192,57,43,.3)', color: '#c0392b', text: 'El pago no se completó. Puedes reintentar el pago desde el carrito o contactarnos.' }
          : null

  const statusSteps = [
    { key: 'pendiente', label: 'Pedido recibido', icon: <Clock size={16} /> },
    { key: 'confirmado', label: 'Confirmado', icon: <CheckCircle2 size={16} /> },
    { key: 'en_preparacion', label: 'En preparación', icon: <Package size={16} /> },
    { key: 'en_reparto', label: 'En reparto', icon: <Truck size={16} /> },
    { key: 'entregado', label: 'Entregado', icon: <MapPin size={16} /> },
  ]
  const currentIdx = statusSteps.findIndex((s) => s.key === order.status)

  const sectionTitle = "text-sm font-bold uppercase tracking-wider mb-5"
  const sectionStyle = { color: 'var(--gray-400)' }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.25)' }}>
            <CheckCircle2 size={40} style={{ color: '#16a34a' }} />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--text)' }}>¡Pedido confirmado!</h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Gracias <strong style={{ color: 'var(--text)' }}>{order.customer_name}</strong>. Recibirás actualizaciones sobre tu pedido.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: '#fff', border: '1px solid var(--gray-100)' }}>
            <span className="text-xs" style={{ color: 'var(--gray-400)' }}>Pedido #</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {paymentBanner && (
          <div className="rounded-2xl p-4 mb-6 text-sm font-semibold text-center"
            style={{ background: paymentBanner.bg, border: `1px solid ${paymentBanner.border}`, color: paymentBanner.color }}>
            {paymentBanner.text}
          </div>
        )}

        <div className="card p-6 mb-6">
          <h2 className={sectionTitle} style={sectionStyle}>Estado del pedido</h2>
          <div className="flex items-center gap-0">
            {statusSteps.map((step, idx) => {
              const isDone = idx <= currentIdx
              const isCurrent = idx === currentIdx
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                      style={isCurrent
                        ? { borderColor: 'var(--red)', background: 'rgba(192,57,43,.1)', color: 'var(--red)' }
                        : isDone
                          ? { borderColor: '#16a34a', background: 'rgba(22,163,74,.1)', color: '#16a34a' }
                          : { borderColor: 'var(--gray-200)', background: 'var(--gray-50)', color: 'var(--gray-300)' }}>
                      {step.icon}
                    </div>
                    <span className="text-xs mt-2 text-center leading-tight max-w-[60px]"
                      style={{ color: isCurrent ? 'var(--red)' : isDone ? '#15803d' : 'var(--gray-400)' }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className="flex-1 h-0.5 mb-6" style={{ background: idx < currentIdx ? '#16a34a' : 'var(--gray-100)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className={sectionTitle} style={sectionStyle}>Detalle del pedido</h2>
          <div className="space-y-3 mb-5">
            {order.items?.map((item: { id: string; product_name: string; size: string; quantity: number; total_price: number }) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p style={{ color: 'var(--text)' }}>{item.product_name}</p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Talla {item.size} · x{item.quantity}</p>
                </div>
                <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--gray-600)' }}>Subtotal</span>
              <span className="tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--gray-600)' }}>Envío</span>
              <span className="tabular-nums" style={{ color: order.shipping_cost === 0 ? '#15803d' : 'var(--text)' }}>
                {order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span className="text-lg tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className={sectionTitle} style={sectionStyle}>Información de entrega</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 items-center">
              <span className="w-24 shrink-0" style={{ color: 'var(--gray-400)' }}>Método</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                {order.delivery_method === 'delivery' ? <><Truck size={15} /> Delivery</> : <><Store size={15} /> Retiro en tienda</>}
              </span>
            </div>
            {order.delivery_method === 'delivery' && (
              <>
                <div className="flex gap-3">
                  <span className="w-24 shrink-0" style={{ color: 'var(--gray-400)' }}>Dirección</span>
                  <span style={{ color: 'var(--text)' }}>{order.delivery_address}, {order.delivery_commune}</span>
                </div>
                {order.delivery_reference && (
                  <div className="flex gap-3">
                    <span className="w-24 shrink-0" style={{ color: 'var(--gray-400)' }}>Referencia</span>
                    <span style={{ color: 'var(--text)' }}>{order.delivery_reference}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-3">
              <span className="w-24 shrink-0" style={{ color: 'var(--gray-400)' }}>Contacto</span>
              <span style={{ color: 'var(--text)' }}>{order.customer_phone}</span>
            </div>
            {order.notes && (
              <div className="flex gap-3">
                <span className="w-24 shrink-0" style={{ color: 'var(--gray-400)' }}>Notas</span>
                <span style={{ color: 'var(--text)' }}>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="btn-ghost flex-1 justify-center py-3 text-center">Seguir comprando</Link>
          <Link href="/" className="btn-primary flex-1 justify-center py-3">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
