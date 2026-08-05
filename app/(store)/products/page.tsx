import { createClient } from '@/lib/supabase/server'
import { Product, Category } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { ProductFilters } from '@/components/store/ProductFilters'
import { Package, Store } from 'lucide-react'
import { PICKUP_PLACE } from '@/lib/pickup'
import { MIN_SHIPPING_COST } from '@/lib/shipping'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

interface SearchParams {
  category?: string
  size?: string
  color?: string
  min?: string
  max?: string
  search?: string
  sort?: string
}

// Antes el título y la descripción eran siempre los mismos sin importar la
// categoría filtrada, perdiendo la oportunidad de posicionar cada búsqueda
// específica ("disfraces de spiderman chile", "máscaras de spiderman chile").
const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  disfraces: {
    title: 'Disfraces de Spider-Man en Chile — Miles Morales, Tom Holland, Venom',
    description: 'Los mejores disfraces de Spider-Man en Chile: Miles Morales, Tom Holland, Tobey Maguire, Andrew Garfield y Venom. Tallas 100 a 190 cm. Envíos a todo Chile o retiro gratis en Santiago.',
  },
  mascaras: {
    title: 'Máscaras de Spider-Man en Chile — PRO ULTRA, Standard y Básicas',
    description: 'Máscaras de Spider-Man en Chile con y sin control remoto: PRO ULTRA, Standard y básicas. Talla única ajustable. Envíos a todo Chile o retiro gratis en Santiago.',
  },
  accesorios: {
    title: 'Accesorios de Spider-Man en Chile',
    description: 'Accesorios de Spider-Man en Chile: lanza telarañas y complementos para tu disfraz. Envíos a todo Chile o retiro gratis en Santiago.',
  },
  peluches: {
    title: 'Peluches de Spider-Man en Chile',
    description: 'Peluches de Spider-Man en Chile, ideales de regalo. Envíos a todo Chile o retiro gratis en Santiago.',
  },
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const { category } = await searchParams
  const seo = category ? CATEGORY_SEO[category] : undefined

  return {
    title: seo?.title ?? 'Catálogo de disfraces y máscaras de Spider-Man en Chile',
    description:
      seo?.description ??
      'Explora todo el catálogo de disfraces y máscaras de Spider-Man en Chile: Miles Morales, Tom Holland, Tobey, Venom y más. Tallas 100 a 190 cm. Envíos a todo Chile.',
    alternates: { canonical: category ? `/products?category=${category}` : '/products' },
  }
}

async function getProducts(params: SearchParams): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('active', true)

  // Filtrar por categoría: resolver slug → category_id
  if (params.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.color) query = query.ilike('color', `%${params.color}%`)
  if (params.min) query = query.gte('price', parseInt(params.min))
  if (params.max) query = query.lte('price', parseInt(params.max))
  if (params.search) query = query.ilike('name', `%${params.search}%`)

  const sort = params.sort ?? 'newest'
  if (sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('stock', { ascending: false }) // primero los que tienen stock

  const { data } = await query
  let products = (data ?? []) as Product[]

  // Filtro de talla: el producto debe tener una variante con esa talla y stock
  if (params.size) {
    products = products.filter((p) =>
      (p.variants ?? []).some((v) => v.active && v.size === params.size)
    )
  }

  return products
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
  const [products, categories] = await Promise.all([getProducts(params), getCategories()])

  const inStock = products.filter(p => p.stock > 0).length
  const categoryLabel = params.category
    ? categories.find(c => c.slug === params.category)?.name
    : 'Todos'
  const categorySeo = params.category ? CATEGORY_SEO[params.category] : undefined

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }} className="pt-28 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="web-pattern" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="section-tag" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)', border: 'none' }}>
            Catálogo
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
            {params.category ? `${categoryLabel} de Spider-Man en Chile` : 'Disfraces y máscaras de Spider-Man en Chile'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,.45)' }}>
            {inStock} productos disponibles · {products.length - inStock} sin stock
          </p>
          {/* Párrafo con las mismas palabras clave que el título/meta:
              el contenido visible pesa más para SEO que el meta description solo. */}
          {categorySeo && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.6)' }}>
              {categorySeo.description}
            </p>
          )}

          {/* Aviso de retiro: antes solo se enteraban dentro del checkout */}
          <div className="mt-5 inline-flex items-start gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <Store size={16} className="mt-0.5 shrink-0" style={{ color: '#4ade80' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,.8)' }}>
              Envíos a todo Chile desde {formatPrice(MIN_SHIPPING_COST)}, o{' '}
              <strong style={{ color: '#fff' }}>retira gratis en {PICKUP_PLACE}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <ProductFilters categories={categories} currentParams={params as Record<string, string | undefined>} />
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 card">
                <Package size={48} className="mx-auto mb-4" style={{ color: '#ddddd8' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: '#1a1a18' }}>Sin resultados</p>
                <p className="text-sm" style={{ color: '#9b9b93' }}>Prueba ajustando los filtros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
