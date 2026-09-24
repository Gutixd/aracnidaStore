import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/server'
import { Product, ProductVariant } from '@/types'
import { notFound } from 'next/navigation'
import { ProductPurchase } from '@/components/store/ProductPurchase'
import { SizeGuide } from '@/components/store/SizeGuide'
import { ProductCard } from '@/components/store/ProductCard'
import { ProductGallery } from '@/components/store/ProductGallery'
import { ScrollReveal } from '@/components/store/ScrollReveal'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Truck, RotateCcw, Package, Star, CheckCircle2, Clock, MapPin, Store } from 'lucide-react'
import { ProductReviews } from '@/components/store/ProductReviews'
import { getReviewSummary, getProductReviews } from '@/lib/actions/reviews'
import { PICKUP_PLACE, PICKUP_SLOTS, PICKUP_LEAD_HOURS } from '@/lib/pickup'
import { safeJsonLd } from '@/lib/jsonld'
import { MIN_SHIPPING_COST } from '@/lib/shipping'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'

// Cada ficha se genera una vez y se sirve cacheada 60 s. Más corto que la
// portada porque aquí se eligen tallas: un agotado se refleja en ≤1 min, y
// igual el checkout revalida el stock en el servidor antes de cobrar.
export const revalidate = 60

// Sin esto Next.js trata /products/[slug] como dinámica aunque tenga
// `revalidate`. Las fichas activas se generan en el build; un producto
// creado después se genera en su primera visita y desde ahí queda cacheado.
export async function generateStaticParams() {
  const { data } = await createPublicClient().from('products').select('slug').eq('active', true)
  return (data ?? []).map((p) => ({ slug: p.slug as string }))
}

// cache() memoiza por request: generateMetadata() y la página llaman a
// getProduct() con el mismo slug, y sin esto cada uno disparaba su propio
// viaje a Supabase — el doble de espera para traer el mismo producto.
const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
})

async function getGalleryImages(productId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('product_images')
    .select('url, alt, order')
    .eq('product_id', productId)
    .order('order', { ascending: true })
  return data ?? []
}

async function getRelated(categoryId: string, productId: string): Promise<Product[]> {
  const supabase = createPublicClient()
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

  // "en Chile" en el título es lo que hace calzar el título con búsquedas
  // reales tipo "traje de spiderman chile" — el nombre solo no lo logra.
  const title = `${product.name} en Chile`
  const description = `${product.description} Envío a todo Chile o retiro gratis en Metro Plaza de Maipú, Santiago.`.slice(0, 300)

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
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
  const [related, galleryImages, reviewSummary, reviews] = await Promise.all([
    getRelated(product.category_id, product.id),
    getGalleryImages(product.id),
    getReviewSummary(product.id),
    getProductReviews(product.id),
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
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'AracnidaStore' },
    },
    // La calificación solo se declara si existen reseñas reales aprobadas.
    // Declarar un rating inventado es una violación de las políticas de Google
    // y expone el sitio a una penalización manual.
    ...(reviewSummary.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewSummary.average,
        reviewCount: reviewSummary.count,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.slice(0, 10).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.customer_name },
        datePublished: r.created_at.slice(0, 10),
        reviewBody: r.comment,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    }),
  }

  // Refleja exactamente las migas de pan visibles (Inicio / Catálogo /
  // Categoría / Producto) para que Google pueda mostrar esa ruta en los
  // resultados de búsqueda en vez de solo la URL cruda.
  const breadcrumbItems = [
    { name: 'Inicio', url: '/' },
    { name: 'Catálogo', url: '/products' },
    ...(product.category
      ? [{ name: product.category.name, url: `/products?category=${product.category.slug}` }]
      : []),
    { name: product.name, url: `/products/${product.slug}` },
  ]
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
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
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />

      {/* ── Main product section ── */}
      <div className="max-w-7xl mx-auto pt-[108px] sm:pt-28 pb-12 px-5 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-[13px] mb-5 sm:mb-8 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--gray-400)' }} aria-label="Migas de pan">
          <Link href="/" className="hover:text-[var(--text)] transition-colors">Inicio</Link>
          <span aria-hidden>/</span>
          <Link href="/products" className="hover:text-[var(--text)] transition-colors">Catálogo</Link>
          {product.category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-[var(--text)] transition-colors">{product.category.name}</Link>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16">

          {/* ── Imagen principal ── */}
          <div>
            <div className="lg:sticky lg:top-28">
              {/* En celular la foto va de borde a borde: es lo primero que
                  mira el cliente y no debe verse como una tarjeta chica. */}
              <div className="relative -mx-5 sm:mx-0 sm:rounded-[20px] overflow-hidden" style={{ aspectRatio: '1/1', background: 'var(--gray-50)' }}>
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={`${product.name} - disfraz Spider-Man en Chile`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width:1024px) 100vw, 55vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--gray-200)' }}>
                    <Package size={80} />
                  </div>
                )}

                {totalStock > 0 && totalStock <= 5 && (
                  <span className="absolute top-4 left-4 sm:left-4 text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ background: '#fff', color: 'var(--red)', boxShadow: '0 0 0 1px var(--gray-100)' }}>
                    Últimas unidades
                  </span>
                )}
              </div>

              {/* Miniaturas: abren la galería completa más abajo */}
              {galleryImages.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                  {galleryImages.slice(0, 6).map((img, i) => (
                    <a key={i} href="#galeria" className="relative rounded-lg overflow-hidden flex-shrink-0"
                      style={{ width: 64, height: 64, background: 'var(--gray-50)' }}>
                      <Image src={img.url} alt={img.alt || `${product.name} ${i + 1}`}
                        fill className="object-cover" sizes="64px" />
                    </a>
                  ))}
                  {galleryImages.length > 6 && (
                    <a href="#galeria" className="rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ width: 64, height: 64, background: 'var(--gray-50)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--gray-600)' }}>+{galleryImages.length - 6}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Info panel ── */}
          <div className="flex flex-col">

            {/* Category + name */}
            {product.category && (
              <Link href={`/products?category=${product.category.slug}`} className="section-tag self-start" style={{ marginBottom: '.5rem' }}>
                {product.category.name}
              </Link>
            )}
            <h1 className="text-[1.75rem] leading-[1.1] sm:text-4xl lg:text-[2.6rem] font-bold"
              style={{ color: 'var(--text)', letterSpacing: '-0.035em' }}>
              {product.name}
            </h1>

            {/* Calificación real: solo se muestra si existen reseñas aprobadas. */}
            <div className="flex items-center gap-2 flex-wrap mt-3 text-sm">
              {reviewSummary.count > 0 ? (
                <>
                  <div className="flex gap-0.5" style={{ color: 'var(--text)' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < Math.round(reviewSummary.average) ? 'currentColor' : 'none'}
                        stroke={i < Math.round(reviewSummary.average) ? 'none' : 'var(--gray-200)'}
                      />
                    ))}
                  </div>
                  <a href="#resenas" className="underline underline-offset-2" style={{ color: 'var(--gray-600)' }}>
                    {reviewSummary.average.toFixed(1)} · {reviewSummary.count} {reviewSummary.count === 1 ? 'reseña' : 'reseñas'}
                  </a>
                </>
              ) : (
                <a href="#resenas" style={{ color: 'var(--gray-400)' }}>Sin reseñas todavía</a>
              )}
              <span style={{ color: 'var(--gray-200)' }}>|</span>
              <span style={{ color: 'var(--gray-600)' }}>+500 clientes en Chile</span>
            </div>

            {/* Compra: precio, tallas, cantidad y botón */}
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--gray-100)' }}>
              <ProductPurchase product={product} variants={variants} />
            </div>

            {/* Size guide */}
            {variants.some((v) => !isNaN(parseInt(v.size))) && (
              <div className="mt-4">
                <SizeGuide />
              </div>
            )}

            {/* Envío y retiro: una sola lista ordenada, en vez de tres cajas
                de colores distintos compitiendo entre sí. */}
            <div className="mt-8 rounded-[var(--radius)] divide-y" style={{ boxShadow: '0 0 0 1px var(--gray-100)', borderColor: 'var(--gray-100)' }}>
              {[
                { icon: <Truck size={18} strokeWidth={1.75} />, t: 'Envío a todo Chile', s: `Desde ${formatPrice(MIN_SHIPPING_COST)} por Blue Express · despacho en 24-48 h hábiles` },
                { icon: <Store size={18} strokeWidth={1.75} />, t: `Retiro gratis en ${PICKUP_PLACE}`, s: `Los ${PICKUP_SLOTS.map((s) => `${s.plural} de ${s.hours}`).join(' y los ')}, coordinando con ${PICKUP_LEAD_HOURS} h de anticipación` },
                { icon: <RotateCcw size={18} strokeWidth={1.75} />, t: 'Cambios dentro de 7 días', s: 'Sin usar y con su empaque original' },
              ].map((row) => (
                <div key={row.t} className="flex items-start gap-3.5 p-4" style={{ borderColor: 'var(--gray-100)' }}>
                  <span className="mt-0.5 shrink-0" style={{ color: 'var(--text)' }}>{row.icon}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{row.t}</p>
                    <p className="text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--gray-600)' }}>{row.s}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción y detalles */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Descripción</h2>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                {product.description}
              </p>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--gray-800)' }}>
                    <CheckCircle2 size={15} strokeWidth={2} style={{ color: '#15803d' }} className="shrink-0" />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp: consulta secundaria, sin competir con "Agregar al carrito" */}
            <a
              href={`https://wa.me/56978829942?text=${encodeURIComponent(`Hola! Me interesa el producto: ${product.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-[10px] text-sm font-semibold transition-colors hover:bg-[var(--gray-50)]"
              style={{ color: 'var(--text)', boxShadow: 'inset 0 0 0 1px var(--gray-200)' }}
            >
              <svg viewBox="0 0 24 24" fill="#25D366" className="w-[18px] h-[18px]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              ¿Dudas? Pregúntanos por WhatsApp
            </a>

          </div>
        </div>

        {/* ── Gallery section ── */}
        {galleryImages.length > 0 && (
          <ScrollReveal delay={80}>
            <div id="galeria" style={{ scrollMarginTop: 110 }}>
              <ProductGallery
                images={galleryImages.map((img) => ({ url: img.url, alt: img.alt || product.name }))}
                productName={product.name}
              />
            </div>
          </ScrollReveal>
        )}

        {/* ── Reseñas de clientes ── */}
        <ScrollReveal delay={60}>
          <ProductReviews
            productId={product.id}
            productName={product.name}
            reviews={reviews}
            average={reviewSummary.average}
            count={reviewSummary.count}
          />
        </ScrollReveal>

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
