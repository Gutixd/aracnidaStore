import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { Shield, Truck, Package, Zap, Star, MapPin, RotateCcw } from 'lucide-react'
import { ScrollReveal } from '@/components/store/ScrollReveal'
import { VideoShowcase } from '@/components/store/VideoShowcase'
import { HeroVideo } from '@/components/store/HeroVideo'

const FAQS = [
  { q: '¿Cuánto demoran los envíos?', a: 'Los pedidos se despachan en 24-48 horas hábiles. Entrega en 1-3 días en la Región Metropolitana y 3-5 días en regiones. También puedes retirar en Metro Plaza de Maipú.' },
  { q: '¿Qué tallas tienen disponibles?', a: 'Disfraces desde talla 100 hasta 190 cm (niños y adultos). Las máscaras son talla única con ajuste elástico. Revisa nuestra guía de tallas para elegir correctamente.' },
  { q: '¿Cuáles son los materiales?', a: 'Lycra/Spandex 95% + 5% Elastano. Tela de alta elasticidad, transpirable y resistente al uso frecuente, con estampado de alta fidelidad.' },
  { q: '¿Hacen cambios o devoluciones?', a: 'Aceptamos cambios dentro de 7 días, siempre que el producto esté sin usar. El cliente cubre el envío de cambio.' },
  { q: '¿Cómo hago seguimiento de mi pedido?', a: 'Al confirmar tu compra recibirás un número de orden. Puedes escribirnos por Instagram para cualquier consulta sobre el estado de tu envío.' },
]

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('active', true)
    .eq('featured', true)
    .order('stock', { ascending: false })
    .limit(6)
  return data ?? []
}


const GALLERY = [
  '/products/disfraz-miles-morales.jpg',
  '/products/mascara-miles-morales-pro.jpg',
  '/products/disfraz-tom-holland.jpg',
  '/products/mascara-tom-holland-std.jpg',
  '/products/disfraz-venom.jpg',
  '/products/mascara-basica-roja-negra.jpg',
  '/products/mascara-miles-morales-std.jpg',
  '/products/mascara-basica-negra.jpg',
]

export default async function HomePage() {
  const featured = await getFeaturedProducts()

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ===== HERO con video de fondo ===== */}
      <HeroVideo />

      {/* ===== VIDEO SHOWCASE ===== */}
      <VideoShowcase />

      {/* ===== TRUST BAR ===== */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Truck size={18} />, t: 'Envíos a todo Chile', s: 'Despacho 24-48h' },
            { icon: <MapPin size={18} />, t: 'Retiro en Maipú', s: 'Metro Plaza de Maipú' },
            { icon: <Shield size={18} />, t: 'Calidad premium', s: 'Control en cada pedido' },
            { icon: <RotateCcw size={18} />, t: 'Cambios 7 días', s: 'Compra con confianza' },
          ].map((b) => (
            <div key={b.t} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
                {b.icon}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#1a1a18' }}>{b.t}</p>
                <p className="text-xs" style={{ color: '#9b9b93' }}>{b.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="section-tag">Colecciones</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>Encuentra tu personaje</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { href: '/products?category=disfraces', label: 'Disfraces', sub: 'Miles, Tom Holland, Venom y más', img: '/products/disfraz-miles-morales.jpg' },
              { href: '/products?category=mascaras', label: 'Máscaras', sub: 'PRO ULTRA, Standard y Básicas', img: '/products/mascara-miles-morales-pro.jpg' },
              { href: '/products?category=accesorios', label: 'Accesorios', sub: 'Lanza telarañas y complementos', img: '/products/lanza-telaranas.jpg' },
            ].map((cat, i) => (
              <ScrollReveal key={cat.label} delay={i * 100}>
                <Link href={cat.href} className="group block">
                  <div className="relative rounded-2xl overflow-hidden h-64 transition-transform duration-300 group-hover:-translate-y-2"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,.15)' }}>
                    <Image src={cat.img} alt={cat.label} fill sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,30,61,.92) 0%, rgba(15,30,61,.35) 50%, transparent 100%)' }} />
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-black text-white">{cat.label}</h3>
                      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.7)' }}>{cat.sub}</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold mt-3 text-white">
                        Ver colección <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section id="featured" className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="section-tag">Destacados</div>
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>Los favoritos</h2>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-all" style={{ color: '#c0392b' }}>
                Ver todos <ChevronRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {featured.map((product) => (
                <div key={product.id}><ProductCard product={product} /></div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20" style={{ color: '#9b9b93' }}>
              <Package size={48} className="mx-auto mb-4 opacity-40" />
              <p>Sin productos destacados</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link href="/products" className="btn-primary text-sm px-6 py-3">Ver catálogo completo <ChevronRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* ===== GALLERY STRIP ===== */}
      <section className="py-4" style={{ background: '#0f1e3d' }}>
        <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
          {GALLERY.map((src, i) => (
            <div key={i} className="relative shrink-0 w-40 h-52 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.06)' }}>
              <Image src={src} alt="Galería Spider-Man" fill sizes="160px" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="section-tag">Ventajas</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>Por qué elegirnos</h2>
              <p className="mt-3 max-w-lg mx-auto" style={{ color: '#5a5a54' }}>Cada producto pasa por control de calidad antes de salir a tu puerta.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={26} />, title: 'Materiales premium', desc: 'Lycra y spandex de primera. Costuras reforzadas para durar en el tiempo.', color: '#c0392b', bg: 'rgba(192,57,43,.08)' },
              { icon: <Truck size={26} />, title: 'Envíos a todo Chile', desc: 'Despacho en 24-48 horas hábiles, o retiro en Metro Plaza de Maipú.', color: '#1a2744', bg: 'rgba(26,39,68,.07)' },
              { icon: <Zap size={26} />, title: 'Alta fidelidad', desc: 'Diseños cuidadosamente detallados. La experiencia más cercana al original.', color: '#d97706', bg: 'rgba(217,119,6,.08)' },
            ].map((feat, i) => (
              <ScrollReveal key={feat.title} delay={i * 120}>
                <div className="card p-8 group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110" style={{ background: feat.bg, color: feat.color }}>
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: '#1a1a18' }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5a5a54' }}>{feat.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <div className="section-tag">Reseñas</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>Lo que dicen nuestros clientes</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Camila R.', city: 'Maipú', text: 'El disfraz de Miles llegó perfecto, la tela es de muy buena calidad y el estampado se ve igual al de la película.' },
              { name: 'Sebastián M.', city: 'Puente Alto', text: 'Compré la máscara PRO ULTRA y quedé impresionado, los ojos se mueven y el ajuste es comodísimo. Despacho rápido.' },
              { name: 'Daniela F.', city: 'Santiago Centro', text: 'Excelente atención, retiré en el metro sin problema. Mi hijo quedó feliz con su traje de Spider-Man.' },
            ].map((r, i) => (
              <ScrollReveal key={r.name} delay={i * 100}>
                <div className="card p-7 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4" style={{ color: '#f59e0b' }}>
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: '#5a5a54' }}>“{r.text}”</p>
                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--gray-100)' }}>
                    <p className="text-sm font-bold" style={{ color: '#1a1a18' }}>{r.name}</p>
                    <p className="text-xs" style={{ color: '#9b9b93' }}>{r.city}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="section-tag">FAQ</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>Preguntas frecuentes</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <details className="group rounded-2xl overflow-hidden cursor-pointer" style={{ background: '#fff', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                  <summary className="flex items-center justify-between px-6 py-5 list-none font-semibold select-none" style={{ color: '#1a1a18' }}>
                    {faq.q}
                    <ChevronRight size={16} className="shrink-0 ml-4 transition-transform duration-300 group-open:rotate-90" style={{ color: '#c0392b' }} />
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#5a5a54', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    {faq.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/guia-de-tallas" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#c0392b' }}>
              Ver guía de tallas completa <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="hero-bg relative rounded-3xl overflow-hidden p-12 md:p-20 text-center">
              <div className="web-pattern" />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(192,57,43,.2), transparent)' }} />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden animate-float" style={{ boxShadow: '0 12px 40px rgba(0,0,0,.3)' }}>
                  <Image src="/logo.jpeg" alt="AracnidaStore" width={80} height={80} className="object-cover" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¿Listo para convertirte en el héroe?</h2>
                <p className="mb-8 text-lg" style={{ color: 'rgba(255,255,255,.5)' }}>Encuentra tu traje o máscara perfecta hoy.</p>
                <Link href="/products" className="btn-primary text-base px-10 py-4">
                  <ShoppingBag size={18} />
                  Ver catálogo
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  )
}
