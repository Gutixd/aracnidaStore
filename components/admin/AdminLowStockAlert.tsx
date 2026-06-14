import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export async function AdminLowStockAlert() {
  const supabase = await createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock, price, size, color')
    .eq('active', true)
    .lte('stock', 3)
    .order('stock', { ascending: true })
    .limit(10)

  return (
    <div className="card">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#b45309' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Stock crítico</h2>
        </div>
        <Link href="/admin/inventory" className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Gestionar</Link>
      </div>
      <div>
        {products && products.length > 0 ? products.map((product) => (
          <Link key={product.id} href={`/admin/products/${product.id}`} className="flex items-center gap-3 p-4" style={{ borderTop: '1px solid var(--gray-50)' }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: product.stock === 0 ? 'var(--red)' : '#eab308' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate font-medium" style={{ color: 'var(--text)' }}>{product.name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--gray-400)' }}>{product.color}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: product.stock === 0 ? 'var(--red)' : '#b45309' }}>
                {product.stock === 0 ? 'Agotado' : `${product.stock} uds.`}
              </p>
              <p className="text-xs tabular-nums" style={{ color: 'var(--gray-400)' }}>{formatPrice(product.price)}</p>
            </div>
          </Link>
        )) : (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--gray-400)' }}>Todo el stock en niveles normales</div>
        )}
      </div>
    </div>
  )
}
