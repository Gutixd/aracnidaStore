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
    <div className="card">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} style={{ color: 'var(--gray-400)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Pedidos recientes</h2>
        </div>
        <Link href="/admin/orders" className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Ver todos</Link>
      </div>
      <div>
        {orders?.map((order) => (
          <Link key={order.id} href={`/admin/orders`} className="flex items-center gap-3 p-4" style={{ borderTop: '1px solid var(--gray-50)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{order.customer_name}</p>
              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(order.total)}</span>
            </div>
          </Link>
        )) ?? <div className="p-8 text-center text-sm" style={{ color: 'var(--gray-400)' }}>Sin pedidos aún</div>}
      </div>
    </div>
  )
}
