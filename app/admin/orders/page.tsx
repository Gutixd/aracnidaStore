import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { Order } from '@/types'
import { AdminOrderStatusChanger } from '@/components/admin/AdminOrderStatusChanger'
import { ShoppingCart, Truck, Store } from 'lucide-react'

async function getOrders(): Promise<Order[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  const byStatus = {
    pendiente: orders.filter((o) => o.status === 'pendiente').length,
    confirmado: orders.filter((o) => o.status === 'confirmado').length,
    en_preparacion: orders.filter((o) => o.status === 'en_preparacion').length,
    en_reparto: orders.filter((o) => o.status === 'en_reparto').length,
    entregado: orders.filter((o) => o.status === 'entregado').length,
    cancelado: orders.filter((o) => o.status === 'cancelado').length,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Pedidos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>{orders.length} pedidos en total</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className={`p-3 rounded-xl border text-center ${ORDER_STATUS_COLORS[status]}`}>
            <p className="text-xl font-black tabular-nums">{count}</p>
            <p className="text-xs mt-0.5">{ORDER_STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

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

              {order.delivery_method === 'delivery' && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Entrega</p>
                  <div className="text-sm space-y-1" style={{ color: 'var(--gray-600)' }}>
                    <p>{order.delivery_address}</p>
                    <p>{order.delivery_commune}</p>
                    {order.delivery_reference && <p style={{ color: 'var(--gray-400)' }}>Ref: {order.delivery_reference}</p>}
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
              <div className="ml-auto">
                <AdminOrderStatusChanger orderId={order.id} currentStatus={order.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
