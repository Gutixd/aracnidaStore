import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { ProductFilters } from '@/components/store/ProductFilters'
import { Package } from 'lucide-react'

interface SearchParams {
  category?: string
  size?: string
  color?: string
  min?: string
  max?: string
  search?: string
  sort?: string
}

async function getProducts(params: SearchParams): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug)')
    .eq('active', true)

  if (params.category) {
    query = query.eq('category.slug', params.category)
  }
  if (params.size) {
    query = query.eq('size', params.size)
  }
  if (params.color) {
    query = query.ilike('color', `%${params.color}%`)
  }
  if (params.min) {
    query = query.gte('price', parseInt(params.min))
  }
  if (params.max) {
    query = query.lte('price', parseInt(params.max))
  }
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const sort = params.sort ?? 'newest'
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data } = await query
  return data ?? []
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ])

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-red-500 font-medium mb-2 tracking-wider uppercase">Tienda</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Catálogo completo</h1>
          <p className="text-white/40 mt-2">{products.length} productos disponibles</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <ProductFilters categories={categories} currentParams={params as Record<string, string | undefined>} />
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-white/30">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Sin productos</p>
                <p className="text-sm">Prueba ajustando los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
