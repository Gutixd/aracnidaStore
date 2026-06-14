import { createClient } from '@/lib/supabase/server'
import { Product, ProductVariant } from '@/types'
import { notFound } from 'next/navigation'
import { ProductPurchase } from '@/components/store/ProductPurchase'
import { SizeGuide } from '@/components/store/SizeGuide'
import { ProductCard } from '@/components/store/ProductCard'
import { ScrollReveal } from '@/components/store/ScrollReveal'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Truck, RotateCcw, Package } from 'lucide-react'
import type { Metadata } from 'next'

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
}

async function getRelated(categoryId: string, productId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
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
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  }
}

function sortVariants(variants: ProductVariant[]): ProductVariant[] {
  return [...variants].sort((a, b) => {
    const na = parseInt(a.size), nb = parseInt(b.size)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.size.localeCompare(b.size)
  })
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const variants = sortVariants((product.variants ?? []).filter((v) => v.active))
  const related = await getRelated(product.category_id, product.id)

  // JSON-LD para SEO de producto
  const minPrice = variants.length ? Math.min(...variants.map((v) => v.price)) : product.price
  const totalStock = variants.reduce((s, v) => s + v.stock, 0)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'AracnidaStore' },
    offers: {
      '@type': 'Offer',
      price: minPrice,
      priceCurrency: 'CLP',
      availability: totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8 flex items-center gap-2" style={{ color: 'var(--gray-400)' }} aria-label="Migas de pan">
          <Link href="/" className="hover:underline">Inicio</Link>
          <span>/</span>
          <Link href="/products" className="hover:underline">Catálogo</Link>
          <span>/</span>
          <span style={{ color: 'var(--gray-600)' }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* Imagen */}
          <ScrollReveal>
            <div className="relative aspect-square rounded-3xl overflow-hidden card">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
                  <Package size={80} />
                </div>
              )}
              {product.featured && (
                <div className="absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--red)', color: '#fff' }}>
                  Destacado
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Info */}
          <ScrollReveal delay={120}>
            <div className="flex flex-col">
              {product.category && (
                <span className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: 'var(--red)' }}>
                  {product.category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-black mb-5 leading-tight" style={{ color: 'var(--text)' }}>
                {product.name}
              </h1>

              <p className="leading-relaxed mb-8" style={{ color: 'var(--gray-600)' }}>
                {product.description}
              </p>

              {/* Compra con variantes */}
              <ProductPurchase product={product} variants={variants} />

              {/* Guía de tallas — solo para productos con tallas numéricas (disfraces) */}
              {variants.some((v) => !isNaN(parseInt(v.size))) && <SizeGuide />}

              {/* Trust badges */}
              <div className="mt-10 pt-6 grid grid-cols-3 gap-4" style={{ borderTop: '1px solid var(--gray-100)' }}>
                {[
                  { icon: <Shield size={18} />, label: 'Calidad garantizada' },
                  { icon: <Truck size={18} />, label: 'Envío a todo Chile' },
                  { icon: <RotateCcw size={18} />, label: 'Cambios en 7 días' },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
                      {b.icon}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--gray-600)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <div>
            <ScrollReveal>
              <h2 className="text-2xl font-black mb-8" style={{ color: 'var(--text)' }}>También te puede interesar</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
