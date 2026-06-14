import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export async function AdminRecentOrders() {
  const supabase = await createAdminClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, total, status, delivery_method, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white">Pedidos recientes</h2>
        </div>
        <Link href="/admin/orders" className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Ver todos →
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders?id=${order.id}`}
            className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{order.customer_name}</p>
              <p className="text-xs text-white/30">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="text-sm font-semibold text-white">{formatPrice(order.total)}</span>
            </div>
          </Link>
        )) ?? (
          <div className="p-8 text-center text-white/30 text-sm">Sin pedidos aún</div>
        )}
      </div>
    </div>
  )
}
