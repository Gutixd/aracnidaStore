import Link from 'next/link'
import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { Shield, Truck, Package, Zap, Star, MapPin, RotateCcw, ChevronRight, ShoppingBag } from 'lucide-react'
import { ScrollReveal } from '@/components/store/ScrollReveal'
import { VideoShowcase } from '@/components/store/VideoShowcase'
import { HeroVideo } from '@/components/store/HeroVideo'
import { safeJsonLd } from '@/lib/jsonld'

// Respuestas concretas y verificables. Los buscadores con IA (ChatGPT, Gemini,
// Perplexity) citan este tipo de contenido directo cuando alguien pregunta
// "dónde comprar un disfraz de Spider-Man en Chile".
const FAQS = [
  { q: '¿Dónde puedo comprar un disfraz de Spider-Man en Chile?', a: 'En AracnidaStore (aracnidastore.com), tienda chilena especializada en disfraces y máscaras de Spider-Man. Despachamos a todo Chile por Blue Express en 24-48 horas hábiles y también entregamos en persona en Metro Plaza de Maipú, Santiago. Hemos entregado más de 500 disfraces y máscaras en todo el país.' },
  { q: '¿Cuánto cuesta un disfraz de Spider-Man?', a: 'Los disfraces completos cuestan $34.990 en tallas 100 a 190 cm. Las máscaras básicas valen $24.990, las máscaras Standard con control remoto y anillo cuestan $45.990, y las PRO ULTRA van entre $69.990 y $90.000. Los precios incluyen IVA.' },
  { q: '¿Cuánto demoran los envíos?', a: 'Los pedidos se despachan en 24-48 horas hábiles por Blue Express. La entrega demora 1-3 días hábiles en la Región Metropolitana, 3-7 días en la zona centro y sur, y 7-12 días en zonas extremas como Aysén y Magallanes. El envío cuesta desde $3.990 según la región, y es gratis en compras sobre $50.000 en la zona centro. También puedes retirar gratis en Metro Plaza de Maipú.' },
  { q: '¿Puedo retirar el pedido en persona en Santiago?', a: 'Sí. Entregamos en Metro Plaza de Maipú los sábados de 11:00 a 15:00. El retiro es gratuito y debes coordinarlo con al menos 24 horas de anticipación. Puedes pagar en efectivo o por transferencia.' },
  { q: '¿Qué tallas tienen disponibles?', a: 'Disfraces desde talla 100 hasta 190 cm, que cubren desde niños pequeños hasta adultos. La talla corresponde a la estatura en centímetros: si mides 175 cm, tu talla es 175. Las máscaras son talla única con ajuste elástico.' },
  { q: '¿De qué material están hechos los disfraces?', a: 'Lycra/Spandex 95% con 5% de elastano. Es una tela de alta elasticidad, transpirable y resistente al uso frecuente, con estampado de alta fidelidad y costuras reforzadas.' },
  { q: '¿Qué modelos de Spider-Man tienen?', a: 'Tenemos disfraces de Miles Morales, Tom Holland, Tobey Maguire, Andrew Garfield y Venom. En máscaras ofrecemos las básicas roja, negra y roja-negra con mecanismo manual, y las Standard y PRO ULTRA con anillo de control remoto que mueve los ojos.' },
  { q: '¿Las máscaras con control remoto cómo funcionan?', a: 'Las máscaras Standard y PRO ULTRA incluyen un anillo con botones que permite cerrar y mover los ojos de forma electrónica. Las máscaras básicas usan un mecanismo manual: al estirar la barbilla hacia abajo los ojos se entrecierran.' },
  { q: '¿Qué medios de pago aceptan?', a: 'Aceptamos tarjetas de crédito y débito a través de Mercado Pago para los envíos a domicilio. Para el retiro en Plaza de Maipú puedes pagar en efectivo o por transferencia bancaria.' },
  { q: '¿Hacen cambios o devoluciones?', a: 'Aceptamos cambios dentro de 7 días desde la recepción, siempre que el producto esté sin usar y con su empaque original. El cliente cubre el costo del envío de cambio.' },
  { q: '¿Cómo hago seguimiento de mi pedido?', a: 'Al confirmar tu compra recibes un correo con el comprobante y tu número de pedido. Puedes revisar el estado en la página del pedido o escribirnos por WhatsApp al +56 9 7882 9942.' },
]

// La portada es igual para todos: se genera una vez y la CDN la sirve a
// cada visitante durante 5 minutos, en vez de consultar Supabase por cada
// uno. Un cambio de stock o una reseña nueva aparece en ≤5 min; el stock
// real se vuelve a validar en el servidor al pagar, así que no se vende
// nada que no exista.
export const revalidate = 300

/** Dato real del negocio, usado en la prueba social y en los datos estructurados. */
export const STORE_FOUNDED_YEAR = 2025
export const CUSTOMERS_SERVED = 500

async function getLatestReviews() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, verified')
    .eq('approved', true)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('active', true)
    .eq('featured', true)
    .order('stock', { ascending: false })
    .limit(6)
  return data ?? []
}



export default async function HomePage() {
  const [featured, latestReviews] = await Promise.all([
    getFeaturedProducts(),
    getLatestReviews(),
  ])

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />

      {/* ===== HERO con video de fondo ===== */}
      <HeroVideo />

      {/* ===== TRUST BAR ===== */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
          {[
            { icon: <Truck size={18} strokeWidth={1.75} />, t: 'Envíos a todo Chile', s: 'Despacho en 24-48 h' },
            { icon: <MapPin size={18} strokeWidth={1.75} />, t: 'Retiro gratis', s: 'Metro Plaza de Maipú' },
            { icon: <Shield size={18} strokeWidth={1.75} />, t: 'Calidad revisada', s: 'Control en cada pedido' },
            { icon: <RotateCcw size={18} strokeWidth={1.75} />, t: 'Cambios en 7 días', s: 'Compra con confianza' },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-3">
              <span className="shrink-0" style={{ color: 'var(--text)' }}>{b.icon}</span>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>{b.t}</p>
                <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--gray-400)' }}>{b.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS =====
          Los productos van primero: es lo que vino a ver el cliente. Antes
          había que pasar dos videos a pantalla completa para llegar acá. */}
      <section id="featured" className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="section-tag">Destacados</span>
              <h2 className="section-title">Los favoritos</h2>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold pb-1"
              style={{ color: 'var(--text)', borderBottom: '1px solid var(--text)' }}>
              Ver todo el catálogo
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20" style={{ color: 'var(--gray-400)' }}>
              <Package size={40} className="mx-auto mb-4 opacity-40" />
              <p>Sin productos destacados</p>
            </div>
          )}

          <div className="mt-10 sm:hidden">
            <Link href="/products" className="btn-dark w-full justify-center">
              Ver todo el catálogo <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="pb-16 sm:pb-24 px-5 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <span className="section-tag">Colecciones</span>
            <h2 className="section-title">Encuentra tu personaje</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
            {[
              { href: '/products?category=disfraces', label: 'Disfraces', sub: 'Miles, Tom Holland, Venom y más', img: '/products/disfraz-miles-morales.jpg' },
              { href: '/products?category=mascaras', label: 'Máscaras', sub: 'PRO ULTRA, Standard y Básicas', img: '/products/mascara-miles-morales-pro.jpg' },
              { href: '/products?category=accesorios', label: 'Accesorios', sub: 'Lanza telarañas y complementos', img: '/products/lanza-telaranas.jpg' },
            ].map((cat, i) => (
              <ScrollReveal key={cat.label} delay={i * 60}>
                <Link href={cat.href} className="group block">
                  <div className="relative rounded-[var(--radius)] overflow-hidden h-56 sm:h-72" style={{ background: 'var(--ink)' }}>
                    <Image src={cat.img} alt={cat.label} fill sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,8,10,.85) 0%, rgba(8,8,10,.15) 55%, transparent 100%)' }} />
                    <div className="absolute inset-0 flex items-end justify-between p-5 sm:p-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white" style={{ letterSpacing: '-.03em' }}>{cat.label}</h3>
                        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,.75)' }}>{cat.sub}</p>
                      </div>
                      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white transition-transform group-hover:translate-x-0.5"
                        style={{ color: 'var(--text)' }}>
                        <ChevronRight size={18} />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VIDEO SHOWCASE ===== */}
      <VideoShowcase />

      {/* ===== WHY US ===== */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-xl">
            <span className="section-tag">Por qué AracnidaStore</span>
            <h2 className="section-title">Hecho para que se vea como en la película</h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--gray-600)' }}>
              Cada producto pasa por control de calidad antes de salir a tu puerta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--gray-100)' }}>
            {[
              { icon: <Shield size={22} strokeWidth={1.75} />, title: 'Materiales premium', desc: 'Lycra y spandex de primera, con costuras reforzadas para durar.' },
              { icon: <Truck size={22} strokeWidth={1.75} />, title: 'Envíos a todo Chile', desc: 'Despacho en 24-48 horas hábiles, o retiro gratis en Metro Plaza de Maipú.' },
              { icon: <Zap size={22} strokeWidth={1.75} />, title: 'Alta fidelidad', desc: 'Diseños detallados: la experiencia más cercana al original.' },
            ].map((feat) => (
              <div key={feat.title} className="p-7 sm:p-9" style={{ background: '#fff' }}>
                <span style={{ color: 'var(--red)' }}>{feat.icon}</span>
                <h3 className="text-lg font-semibold mt-5 mb-2" style={{ color: 'var(--text)' }}>{feat.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      {/* Números grandes, pero todos comprobables: entregas acumuladas,
          plazos que de verdad cumplimos y condiciones que están escritas en
          los Términos. A propósito no hay porcentajes de satisfacción
          inventados (98%, 97%...): con las reseñas que hay hoy, cualquier
          cifra así sería un número sacado del aire. */}
      <section className="py-14 sm:py-20 px-5 sm:px-6 lg:px-8" style={{ background: 'var(--ink)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {[
            { n: '+500', l: 'Disfraces y máscaras entregados', s: `Desde ${STORE_FOUNDED_YEAR} en todo Chile` },
            { n: '24-48h', l: 'Despacho', s: 'Días hábiles, por Blue Express' },
            { n: '15%', l: 'De descuento reservando', s: 'Con 15 días de anticipación' },
            { n: '7 días', l: 'Para cambios', s: 'Desde que recibes tu pedido' },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-4xl md:text-5xl font-bold text-white tabular-nums" style={{ letterSpacing: '-.045em' }}>{s.n}</p>
              <p className="text-sm font-medium mt-2 text-white">{s.l}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.5)' }}>{s.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <span className="section-tag">Reseñas</span>
            <h2 className="section-title">Lo que dicen nuestros clientes</h2>
            <p className="mt-3 text-base" style={{ color: 'var(--gray-600)' }}>
              Más de <strong style={{ color: 'var(--text)' }}>500 disfraces y máscaras</strong> entregados en todo Chile
              desde {STORE_FOUNDED_YEAR}.
            </p>
          </div>

          {/* Reseñas reales aprobadas desde el panel. Si aún no hay,
              mostramos la invitación en vez de testimonios inventados. */}
          {latestReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestReviews.map((r, i) => (
                <ScrollReveal key={r.id} delay={i * 60}>
                  <figure className="h-full flex flex-col rounded-[var(--radius)] p-6 sm:p-7" style={{ background: 'var(--gray-50)' }}>
                    <div className="flex gap-0.5 mb-4" style={{ color: 'var(--text)' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={15} fill={j < r.rating ? 'currentColor' : 'none'}
                          stroke={j < r.rating ? 'none' : 'var(--gray-200)'} />
                      ))}
                    </div>
                    <blockquote className="text-[15px] leading-relaxed flex-1" style={{ color: 'var(--gray-800)' }}>&ldquo;{r.comment}&rdquo;</blockquote>
                    <figcaption className="mt-6">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.customer_name}</p>
                      {r.verified && (
                        <p className="text-xs inline-flex items-center gap-1 mt-0.5" style={{ color: '#15803d' }}>
                          <Shield size={11} /> Compra verificada
                        </p>
                      )}
                    </figcaption>
                  </figure>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius)] p-10 text-center max-w-2xl" style={{ background: 'var(--gray-50)' }}>
              <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>¿Ya compraste con nosotros?</p>
              <p className="text-sm mb-6" style={{ color: 'var(--gray-600)' }}>
                Cuéntanos qué te pareció tu disfraz o máscara. Tu opinión ayuda a que otros
                clientes compren con confianza.
              </p>
              <Link href="/products" className="btn-dark">Dejar mi reseña</Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <span className="section-tag">Ayuda</span>
            <h2 className="section-title">Preguntas frecuentes</h2>
          </div>

          <div style={{ borderTop: '1px solid var(--gray-200)' }}>
            {FAQS.map((faq, i) => (
              <details key={i} className="group" style={{ borderBottom: '1px solid var(--gray-200)' }}>
                <summary className="flex items-center justify-between gap-4 py-5 list-none cursor-pointer select-none text-[15px] sm:text-base font-medium" style={{ color: 'var(--text)' }}>
                  {faq.q}
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 group-open:rotate-45"
                    style={{ background: '#fff', boxShadow: '0 0 0 1px var(--gray-200)', color: 'var(--text)', fontSize: 18, lineHeight: 1 }}>
                    +
                  </span>
                </summary>
                <div className="pb-5 pr-10 text-sm sm:text-[15px] leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/guia-de-tallas" className="inline-flex items-center gap-1 text-sm font-semibold pb-1"
              style={{ color: 'var(--text)', borderBottom: '1px solid var(--text)' }}>
              Ver guía de tallas completa
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="px-5 sm:px-6 lg:px-8 py-16 sm:py-20" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto rounded-[20px] px-6 py-14 sm:p-20 text-center" style={{ background: 'var(--ink)' }}>
          <h2 className="text-3xl sm:text-5xl font-bold text-white" style={{ letterSpacing: '-.04em', lineHeight: 1.05 }}>
            ¿Listo para convertirte<br className="hidden sm:block" /> en el héroe?
          </h2>
          <p className="mt-4 mb-8 text-base sm:text-lg" style={{ color: 'rgba(255,255,255,.65)' }}>
            Encuentra tu traje o máscara perfecta hoy.
          </p>
          <Link href="/products" className="btn-primary text-base px-9">
            <ShoppingBag size={18} />
            Ver catálogo
          </Link>
        </div>
      </section>

    </div>
  )
}
