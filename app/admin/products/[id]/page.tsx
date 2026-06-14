import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdminProductForm } from '@/components/admin/AdminProductForm'
import { AdminStockManager } from '@/components/admin/AdminStockManager'
import { formatDate } from '@/lib/utils'

async function getProduct(id: string) {
  if (id === 'new') return null
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function getCategories() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('categories').select('*')
  return data ?? []
}

async function getMovements(productId: string) {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProduct(id), getCategories()])

  if (id !== 'new' && !product) notFound()

  const movements = product ? await getMovements(product.id) : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {product ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        {product && (
          <p className="text-white/40 text-sm mt-1">SKU: {product.sku}</p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-2">
          <AdminProductForm product={product} categories={categories} />
        </div>

        {/* Stock manager */}
        {product && (
          <div className="space-y-6">
            <AdminStockManager product={product} />

            {/* Movement history */}
            <div className="bg-[#111827] border border-white/5 rounded-xl">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Historial de movimientos</h2>
              </div>
              <div className="divide-y divide-white/5">
                {movements.length > 0 ? movements.map((m) => (
                  <div key={m.id} className="p-4 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        m.type === 'increase' || m.type === 'return'
                          ? 'bg-green-900/20 text-green-400'
                          : m.type === 'sale'
                          ? 'bg-blue-900/20 text-blue-400'
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {m.type === 'increase' ? '+' : m.type === 'sale' ? '🛒' : '-'} {m.type}
                      </span>
                      <span className="text-xs text-white/30">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      <span>{m.previous_stock}</span>
                      <span className="text-white/20">→</span>
                      <span className="font-semibold text-white">{m.new_stock}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs truncate">{m.reason}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-white/30 text-xs">Sin movimientos</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
