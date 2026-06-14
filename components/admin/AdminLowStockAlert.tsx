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
    <div className="bg-[#111827] border border-white/5 rounded-xl">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-500/60" />
          <h2 className="text-sm font-semibold text-white">Stock crítico</h2>
        </div>
        <Link href="/admin/inventory" className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Gestionar →
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {products && products.length > 0 ? products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${product.stock === 0 ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{product.name}</p>
              <p className="text-xs text-white/30">{product.size} · {product.color}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${product.stock === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {product.stock === 0 ? 'Agotado' : `${product.stock} uds.`}
              </p>
              <p className="text-xs text-white/30">{formatPrice(product.price)}</p>
            </div>
          </Link>
        )) : (
          <div className="p-8 text-center text-white/30 text-sm">
            ✓ Todo el stock en niveles normales
          </div>
        )}
      </div>
    </div>
  )
}
