import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { ProductCard } from '@/components/store/ProductCard'
import Image from 'next/image'
import { Shield, Truck, RotateCcw, Package } from 'lucide-react'
import type { Metadata } from 'next'

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
}

async function getRelated(categoryId: string, productId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug)')
    .eq('category_id', categoryId)
    .eq('active', true)
    .neq('id', productId)
    .limit(4)
  return data ?? []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelated(product.category_id, product.id)
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 3

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-white/30 mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-white/60 transition-colors">Inicio</a>
          <span>/</span>
          <a href="/products" className="hover:text-white/60 transition-colors">Catálogo</a>
          <span>/</span>
          <span className="text-white/60">{product.name}</span>
        </nav>

        {/* Product detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* Image */}
          <div className="relative aspect-square bg-[#0d1117] rounded-2xl overflow-hidden border border-white/5">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10">
                <Package size={80} />
              </div>
            )}

            {product.featured && (
              <div className="absolute top-4 left-4 bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Destacado
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Category */}
            {product.category && (
              <span className="text-sm text-red-500 font-medium mb-3 uppercase tracking-wider">
                {product.category.name}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-black text-white">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Attributes */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <span className="text-xs text-white/40 block mb-0.5">Talla</span>
                <span className="text-sm font-semibold text-white">{product.size}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <span className="text-xs text-white/40 block mb-0.5">Color</span>
                <span className="text-sm font-semibold text-white capitalize">{product.color}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <span className="text-xs text-white/40 block mb-0.5">SKU</span>
                <span className="text-sm font-semibold text-white">{product.sku}</span>
              </div>
            </div>

            {/* Stock */}
            {isLowStock && (
              <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-4 py-3 mb-6 text-sm text-yellow-400">
                ⚠️ Solo quedan {product.stock} unidades disponibles
              </div>
            )}
            {isOutOfStock && (
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-6 text-sm text-red-400">
                ❌ Producto agotado temporalmente
              </div>
            )}

            {/* Description */}
            <p className="text-white/50 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Add to cart */}
            <div className="mb-8">
              <AddToCartButton product={product} />
            </div>

            {/* Trust badges */}
            <div className="border-t border-white/5 pt-6 grid grid-cols-3 gap-4">
              {[
                { icon: <Shield size={16} />, label: 'Calidad garantizada' },
                { icon: <Truck size={16} />, label: 'Envío a todo Chile' },
                { icon: <RotateCcw size={16} />, label: 'Cambios en 7 días' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 bg-red-900/10 rounded-lg flex items-center justify-center text-red-500">
                    {b.icon}
                  </div>
                  <span className="text-xs text-white/30">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">También te puede interesar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
