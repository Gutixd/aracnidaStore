import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdminProductForm } from '@/components/admin/AdminProductForm'
import { AdminVariantManager } from '@/components/admin/AdminVariantManager'
import { formatDate } from '@/lib/utils'

async function getProduct(id: string) {
  if (id === 'new') return null
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
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
    .limit(12)
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
          {product ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        {product && <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>SKU: {product.sku}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <AdminProductForm product={product} categories={categories} />
        </div>

        {product && (
          <div className="space-y-6">
            {product.variants && product.variants.length > 0 && (
              <AdminVariantManager productId={product.id} variants={product.variants} />
            )}

            <div className="card overflow-hidden">
              <div className="p-5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Historial de movimientos</h2>
              </div>
              <div>
                {movements.length > 0 ? movements.map((m) => (
                  <div key={m.id} className="p-4 text-sm" style={{ borderTop: '1px solid var(--gray-50)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded"
                        style={
                          m.type === 'increase' || m.type === 'return'
                            ? { background: 'rgba(22,163,74,.1)', color: '#15803d' }
                            : m.type === 'sale'
                              ? { background: 'rgba(26,39,68,.08)', color: 'var(--blue)' }
                              : { background: 'rgba(234,179,8,.12)', color: '#b45309' }
                        }>
                        {m.type}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{formatDate(m.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--gray-600)' }}>
                      <span className="tabular-nums">{m.previous_stock}</span>
                      <span style={{ color: 'var(--gray-200)' }}>→</span>
                      <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>{m.new_stock}</span>
                      <span style={{ color: 'var(--gray-200)' }}>·</span>
                      <span className="text-xs truncate">{m.reason}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-xs" style={{ color: 'var(--gray-400)' }}>Sin movimientos</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
