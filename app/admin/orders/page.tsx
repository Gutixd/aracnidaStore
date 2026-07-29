import { createAdminClient } from '@/lib/supabase/server'
import {
  formatPrice, formatDate,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/utils'
import { PICKUP_SLOT_LABELS, PICKUP_PLACE, formatPickupDate } from '@/lib/pickup'
import { Order } from '@/types'
import { AdminOrderStatusChanger } from '@/components/admin/AdminOrderStatusChanger'
import { AdminPaymentStatusChanger } from '@/components/admin/AdminPaymentStatusChanger'
import { releaseExpiredOrders } from '@/lib/actions/orders'
import { ShoppingCart, Truck, Store, Calendar, Clock, Banknote, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOrders(): Promise<Order[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminOrdersPage() {
  // Libera stock de checkouts abandonados antes de mostrar el listado
  await releaseExpiredOrders()
  const orders = await getOrders()

  const porCobrar = orders.filter(
    (o) => o.payment_status === 'pendiente' && o.status !== 'cancelado'
  )
  const totalPorCobrar = porCobrar.reduce((s, o) => s + Number(o.total), 0)

  const byStatus = {
    pendiente: orders.filter((o) => o.status === 'pendiente').length,
    confirmado: orders.filter((o) => o.status === 'confirmado').length,
    en_preparacion: orders.filter((o) => o.status === 'en_preparacion').length,
    en_reparto: orders.filter((o) => o.status === 'en_reparto').length,
    entregado: orders.filter((o) => o.status === 'entregado').length,
    cancelado: orders.filter((o) => o.status === 'cancelado').length,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Pedidos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>{orders.length} pedidos en total</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className={`p-3 rounded-xl border text-center ${ORDER_STATUS_COLORS[status]}`}>
            <p className="text-xl font-black tabular-nums">{count}</p>
            <p className="text-xs mt-0.5">{ORDER_STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      {porCobrar.length > 0 && (
        <div className="mb-8 rounded-xl p-4 flex items-center gap-3 border bg-amber-50 border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{porCobrar.length}</strong>{' '}
            {porCobrar.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de cobro por{' '}
            <strong className="tabular-nums">{formatPrice(totalPorCobrar)}</strong>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="card p-16 text-center" style={{ color: 'var(--gray-400)' }}>
            <ShoppingCart size={40} className="mx-auto mb-4" />
            <p>Sin pedidos aún</p>
          </div>
        )}
        {orders.map((order) => (
          <div key={order.id} className="card overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs" style={{ color: 'var(--gray-400)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded inline-flex items-center gap-1" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                    {order.delivery_method === 'delivery' ? <><Truck size={12} /> Delivery</> : <><Store size={12} /> Retiro</>}
                  </span>
                </div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>{order.customer_name}</p>
                <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
                  <span>{order.customer_phone}</span><span>·</span>
                  <span>{order.customer_email}</span><span>·</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(order.total)}</p>
                {order.shipping_cost > 0 && <p className="text-xs" style={{ color: 'var(--gray-400)' }}>+{formatPrice(order.shipping_cost)} envío</p>}
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Productos</p>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--gray-800)' }}>{item.product_name} · Talla {item.size} × {item.quantity}</span>
                      <span className="shrink-0 ml-3 tabular-nums" style={{ color: 'var(--gray-600)' }}>{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.delivery_method === 'delivery' ? (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Entrega</p>
                  <div className="text-sm space-y-1" style={{ color: 'var(--gray-600)' }}>
                    <p>{order.delivery_address}</p>
                    <p>{order.delivery_commune}</p>
                    {order.delivery_region && <p style={{ color: 'var(--gray-400)' }}>{order.delivery_region}</p>}
                    {order.delivery_reference && <p style={{ color: 'var(--gray-400)' }}>Ref: {order.delivery_reference}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>
                    Retiro en {PICKUP_PLACE}
                  </p>
                  <div className="text-sm space-y-2" style={{ color: 'var(--gray-600)' }}>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} style={{ color: 'var(--gray-400)' }} />
                      <span className="font-semibold capitalize" style={{ color: 'var(--text)' }}>
                        {order.pickup_date
                          ? formatPickupDate(order.pickup_date)
                          : order.pickup_slot
                            ? `${PICKUP_SLOT_LABELS[order.pickup_slot] ?? order.pickup_slot} (sin fecha)`
                            : 'Día no indicado'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--gray-400)' }} />
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {order.pickup_time ?? 'Hora no indicada'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Banknote size={14} style={{ color: 'var(--gray-400)' }} />
                      {order.payment_method
                        ? PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method
                        : 'Método no indicado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex flex-wrap items-end justify-between gap-4">
              {order.notes && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-100)' }}>
                  Nota: {order.notes}
                </p>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Pago</p>
                  <AdminPaymentStatusChanger orderId={order.id} currentStatus={order.payment_status} />
                </div>
                <div>
                  <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Estado</p>
                  <AdminOrderStatusChanger orderId={order.id} currentStatus={order.status} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
