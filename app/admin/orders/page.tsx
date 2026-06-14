import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { Order } from '@/types'
import { AdminOrderStatusChanger } from '@/components/admin/AdminOrderStatusChanger'
import { ShoppingCart } from 'lucide-react'

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
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-white/40 text-sm mt-1">{orders.length} pedidos en total</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className={`p-3 rounded-xl border text-center ${ORDER_STATUS_COLORS[status]}`}>
            <p className="text-xl font-black">{count}</p>
            <p className="text-xs mt-0.5 opacity-80">{ORDER_STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-16 text-center text-white/30">
            <ShoppingCart size={40} className="mx-auto mb-4 opacity-30" />
            <p>Sin pedidos aún</p>
          </div>
        )}
        {orders.map((order) => (
          <div key={order.id} className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
            {/* Header */}
            <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-white/30">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  {order.delivery_method === 'delivery' ? (
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">🚚 Delivery</span>
                  ) : (
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">🏪 Retiro</span>
                  )}
                </div>
                <p className="text-white font-semibold">{order.customer_name}</p>
                <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                  <span>{order.customer_phone}</span>
                  <span>·</span>
                  <span>{order.customer_email}</span>
                  <span>·</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{formatPrice(order.total)}</p>
                {order.shipping_cost > 0 && (
                  <p className="text-xs text-white/30">+{formatPrice(order.shipping_cost)} envío</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Productos</p>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-white/70">
                        {item.product_name} · {item.size} · {item.color} × {item.quantity}
                      </span>
                      <span className="text-white/50 shrink-0 ml-3">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.delivery_method === 'delivery' && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Entrega</p>
                  <div className="text-sm text-white/60 space-y-1">
                    <p>{order.delivery_address}</p>
                    <p>{order.delivery_commune}</p>
                    {order.delivery_reference && (
                      <p className="text-white/30">Ref: {order.delivery_reference}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes + Status changer */}
            <div className="px-5 pb-5 flex flex-wrap items-end justify-between gap-4">
              {order.notes && (
                <p className="text-xs text-white/30 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                  📝 {order.notes}
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
