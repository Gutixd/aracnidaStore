import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils'
import { CheckCircle2, Package, Truck, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getOrder(id: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single()
  return data
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  const statusSteps = [
    { key: 'pendiente', label: 'Pedido recibido', icon: <Clock size={16} /> },
    { key: 'confirmado', label: 'Confirmado', icon: <CheckCircle2 size={16} /> },
    { key: 'en_preparacion', label: 'En preparación', icon: <Package size={16} /> },
    { key: 'en_reparto', label: 'En reparto', icon: <Truck size={16} /> },
    { key: 'entregado', label: 'Entregado', icon: <MapPin size={16} /> },
  ]

  const currentIdx = statusSteps.findIndex((s) => s.key === order.status)

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">¡Pedido confirmado!</h1>
          <p className="text-white/50">
            Gracias <strong className="text-white">{order.customer_name}</strong>. Recibirás
            actualizaciones sobre tu pedido.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="text-xs text-white/50">Pedido #</span>
            <span className="text-sm font-mono font-bold text-white">
              {order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Status tracker */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-5">
            Estado del pedido
          </h2>
          <div className="flex items-center gap-0">
            {statusSteps.map((step, idx) => {
              const isDone = idx <= currentIdx
              const isCurrent = idx === currentIdx
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? 'border-red-500 bg-red-900/20 text-red-400'
                        : isDone
                        ? 'border-green-500 bg-green-900/20 text-green-400'
                        : 'border-white/10 bg-white/5 text-white/20'
                    }`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs mt-2 text-center leading-tight max-w-[60px] ${
                      isCurrent ? 'text-red-400' : isDone ? 'text-green-400' : 'text-white/20'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-6 ${idx < currentIdx ? 'bg-green-700' : 'bg-white/5'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-5">
            Detalle del pedido
          </h2>
          <div className="space-y-3 mb-5">
            {order.items?.map((item: { id: string; product_name: string; size: string; color: string; quantity: number; total_price: number }) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-white/80">{item.product_name}</p>
                  <p className="text-white/30 text-xs">{item.size} · {item.color} · x{item.quantity}</p>
                </div>
                <span className="font-semibold text-white">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Envío</span>
              <span className={order.shipping_cost === 0 ? 'text-green-400' : 'text-white'}>
                {order.shipping_cost === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-white text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-5">
            Información de entrega
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-white/30 w-24 shrink-0">Método</span>
              <span className="text-white">
                {order.delivery_method === 'delivery' ? '🚚 Delivery' : '🏪 Retiro en tienda'}
              </span>
            </div>
            {order.delivery_method === 'delivery' && (
              <>
                <div className="flex gap-3">
                  <span className="text-white/30 w-24 shrink-0">Dirección</span>
                  <span className="text-white">{order.delivery_address}, {order.delivery_commune}</span>
                </div>
                {order.delivery_reference && (
                  <div className="flex gap-3">
                    <span className="text-white/30 w-24 shrink-0">Referencia</span>
                    <span className="text-white">{order.delivery_reference}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-3">
              <span className="text-white/30 w-24 shrink-0">Contacto</span>
              <span className="text-white">{order.customer_phone}</span>
            </div>
            {order.notes && (
              <div className="flex gap-3">
                <span className="text-white/30 w-24 shrink-0">Notas</span>
                <span className="text-white">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center py-3 rounded-xl font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            Seguir comprando
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)' }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
