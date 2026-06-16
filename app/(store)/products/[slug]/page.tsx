import { createClient } from '@/lib/supabase/server'
import { Product, ProductVariant } from '@/types'
import { notFound } from 'next/navigation'
import { ProductPurchase } from '@/components/store/ProductPurchase'
import { SizeGuide } from '@/components/store/SizeGuide'
import { ProductCard } from '@/components/store/ProductCard'
import { ProductGallery } from '@/components/store/ProductGallery'
import { ScrollReveal } from '@/components/store/ScrollReveal'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Truck, RotateCcw, Package, Star, CheckCircle2, Clock, MapPin } from 'lucide-react'
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

async function getGalleryImages(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_images')
    .select('url, alt, order')
    .eq('product_id', productId)
    .order('order', { ascending: true })
  return data ?? []
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
  const [related, galleryImages] = await Promise.all([
    getRelated(product.category_id, product.id),
    getGalleryImages(product.id),
  ])

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

  const isMask = product.category?.slug === 'mascaras'
  const isAccessory = product.category?.slug === 'accesorios'

  const features = isMask
    ? [
        { icon: <Star size={15} />, text: 'Acabado de alta fidelidad' },
        { icon: <CheckCircle2 size={15} />, text: 'Material flexible y resistente' },
        { icon: <Shield size={15} />, text: 'Calidad garantizada' },
        { icon: <Package size={15} />, text: 'Entrega en caja protegida' },
      ]
    : isAccessory
    ? [
        { icon: <CheckCircle2 size={15} />, text: 'Material de calidad premium' },
        { icon: <Shield size={15} />, text: 'Calidad garantizada' },
        { icon: <Package size={15} />, text: 'Envío protegido' },
      ]
    : [
        { icon: <Star size={15} />, text: 'Tela de alta calidad' },
        { icon: <CheckCircle2 size={15} />, text: 'Diseño de alta fidelidad' },
        { icon: <Shield size={15} />, text: 'Costuras reforzadas' },
        { icon: <Package size={15} />, text: 'Incluye disfraz completo' },
      ]

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Main product section ── */}
      <div className="max-w-7xl mx-auto pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-10 flex items-center gap-2 flex-wrap" style={{ color: 'var(--gray-400)' }} aria-label="Migas de pan">
          <Link href="/" className="hover:underline transition-colors hover:text-[var(--red)]">Inicio</Link>
          <span>/</span>
          <Link href="/products" className="hover:underline transition-colors hover:text-[var(--red)]">Catálogo</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/products?category=${product.category.slug}`} className="hover:underline transition-colors hover:text-[var(--red)]">{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--gray-600)' }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-0">

          {/* ── Imagen principal ── */}
          <ScrollReveal>
            <div className="sticky top-28">
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  aspectRatio: '3/4',
                  background: '#fff',
                  boxShadow: '0 25px 60px rgba(0,0,0,.12), 0 8px 20px rgba(0,0,0,.06)',
                  border: '1.5px solid var(--gray-100)',
                }}
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={`${product.name} - disfraz Spider-Man en Chile`}
                    fill
                    className="object-contain p-4"
                    priority
                    sizes="(max-width:1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
                    <Package size={80} />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--red)', color: '#fff' }}>
                      Destacado
                    </span>
                  )}
                  {totalStock > 0 && totalStock <= 5 && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#b45309', color: '#fff' }}>
                      Últimas unidades
                    </span>
                  )}
                </div>

                {/* Watermark corner */}
                <div className="absolute bottom-3 right-3 text-xs font-black tracking-wider opacity-20"
                  style={{ color: 'var(--red)', fontSize: '10px' }}>
                  ARACNIDA
                </div>
              </div>

              {/* Thumbnail strip from gallery */}
              {galleryImages.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden flex-shrink-0"
                      style={{ width: 64, height: 64, border: '1.5px solid var(--gray-100)', background: '#fff' }}>
                      <Image src={img.url} alt={img.alt || `${product.name} ${i + 1}`}
                        fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                  {galleryImages.length > 6 && (
                    <div className="relative rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ width: 64, height: 64, border: '1.5px solid var(--gray-100)', background: 'var(--gray-50)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--gray-400)' }}>+{galleryImages.length - 6}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* ── Info panel ── */}
          <ScrollReveal delay={120}>
            <div className="flex flex-col gap-6">

              {/* Category + name */}
              <div>
                {product.category && (
                  <Link href={`/products?category=${product.category.slug}`}>
                    <span className="text-xs font-bold uppercase tracking-widest mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)', border: '1px solid rgba(192,57,43,.15)' }}>
                      {product.category.name}
                    </span>
                  </Link>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-black leading-tight mt-3"
                  style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {product.name}
                </h1>
              </div>

              {/* Stars / social proof */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" stroke="none" />
                  ))}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--gray-600)' }}>5.0</span>
                <span className="text-sm" style={{ color: 'var(--gray-400)' }}>· Calidad verificada</span>
              </div>

              {/* Description */}
              <p className="text-base leading-relaxed" style={{ color: 'var(--gray-600)', lineHeight: 1.75 }}>
                {product.description}
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2">
                {features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)' }}>
                    <span style={{ color: 'var(--red)' }}>{f.icon}</span>
                    {f.text}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--gray-100)' }} />

              {/* Purchase section */}
              <ProductPurchase product={product} variants={variants} />

              {/* Size guide */}
              {variants.some((v) => !isNaN(parseInt(v.size))) && <SizeGuide />}

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--gray-100)' }} />

              {/* Shipping info box */}
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: 'rgba(192,57,43,.04)', border: '1px solid rgba(192,57,43,.12)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--red)' }}>Envío y entrega</p>
                {[
                  { icon: <Truck size={15} />, text: 'Envíos a todo Chile por Starken / Chilexpress' },
                  { icon: <Clock size={15} />, text: 'Despacho en 24–48 hrs hábiles' },
                  { icon: <MapPin size={15} />, text: 'Costo de envío según región de destino' },
                  { icon: <RotateCcw size={15} />, text: 'Cambios aceptados dentro de 7 días' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ color: 'var(--red)', flexShrink: 0 }}>{item.icon}</span>
                    <span className="text-sm" style={{ color: 'var(--gray-600)' }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Shield size={20} />, label: 'Calidad', sub: 'garantizada' },
                  { icon: <Truck size={20} />, label: 'Envío', sub: 'todo Chile' },
                  { icon: <RotateCcw size={20} />, label: 'Cambios', sub: '7 días' },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-2xl"
                    style={{ background: '#fff', border: '1px solid var(--gray-100)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{b.label}</p>
                      <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/56978829942?text=${encodeURIComponent(`Hola! Me interesa el producto: ${product.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 16px rgba(37,211,102,.3)' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </a>

            </div>
          </ScrollReveal>
        </div>

        {/* ── Gallery section ── */}
        {galleryImages.length > 0 && (
          <ScrollReveal delay={80}>
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0' }}>
              <ProductGallery
                images={galleryImages.map((img) => ({ url: img.url, alt: img.alt || product.name }))}
                productName={product.name}
              />
            </div>
          </ScrollReveal>
        )}

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div className="mt-20 pb-8">
            <ScrollReveal>
              <div className="flex items-end gap-4 mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--red)' }}>
                    También te puede gustar
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black leading-none" style={{ color: 'var(--text)' }}>
                    Productos relacionados
                  </h2>
                </div>
              </div>
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
