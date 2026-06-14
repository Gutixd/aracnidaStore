import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import Image from 'next/image'
import { ShoppingBag, Shield, Truck, ChevronRight, Package, Zap, Shirt, VenetianMask, Gift } from 'lucide-react'
import { ScrollReveal } from '@/components/store/ScrollReveal'

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('active', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div className="overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="web-pattern" />

        {/* Floating spider circles */}
        <div className="absolute top-1/4 right-[10%] w-72 h-72 rounded-full opacity-10 animate-spin-slow pointer-events-none"
          style={{ border: '1px solid rgba(192,57,43,.5)', borderStyle: 'dashed' }} />
        <div className="absolute bottom-1/4 left-[8%] w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,.3)', borderStyle: 'dashed', animationDuration: '30s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-10 animate-fade-in"
            style={{ background: 'rgba(192,57,43,.15)', color: '#f87171', border: '1px solid rgba(192,57,43,.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Nuevos modelos disponibles · Envíos a todo Chile
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-none animate-fade-up">
            <span className="text-white block">Viste la</span>
            <span className="block mt-1"
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #f87171 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              leyenda.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-lg mx-auto mb-12 leading-relaxed animate-fade-up delay-200">
            Trajes y máscaras Spider-Man de calidad premium.
            Materiales de primera, diseños de alta fidelidad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link
              href="/products"
              className="btn-primary text-base px-8 py-4"
            >
              <ShoppingBag size={18} />
              Ver catálogo completo
            </Link>
            <Link
              href="#featured"
              className="flex items-center gap-2 text-sm font-semibold transition-all"
              style={{ color: 'rgba(255,255,255,.5)' }}
            >
              Ver destacados <ChevronRight size={16} />
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-24 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-up delay-500">
            {[
              { value: '50+', label: 'Productos' },
              { value: '48h', label: 'Despacho' },
              { value: '★ 5.0', label: 'Reseñas' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.35)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-float"
          style={{ color: 'rgba(255,255,255,.25)' }}>
          <span className="text-[10px] tracking-[.2em] uppercase">Scroll</span>
          <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.25), transparent)' }} />
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="section-tag">Colecciones</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>
                Encuentra tu personaje
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                href: '/products?category=disfraces',
                label: 'Disfraces',
                sub: 'Miles Morales, Tom Holland, Tobey, Venom',
                icon: <Shirt size={40} strokeWidth={1.5} />,
                bg: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)',
              },
              {
                href: '/products?category=mascaras',
                label: 'Máscaras',
                sub: 'PRO ULTRA, Standard, Básica',
                icon: <VenetianMask size={40} strokeWidth={1.5} />,
                bg: 'linear-gradient(135deg, #c0392b 0%, #96281b 100%)',
              },
              {
                href: '/products?category=peluches',
                label: 'Peluches',
                sub: 'Spider-Man original de colección',
                icon: <Gift size={40} strokeWidth={1.5} />,
                bg: 'linear-gradient(135deg, #2c3e6b 0%, #1a2744 100%)',
              },
            ].map((cat, i) => (
              <ScrollReveal key={cat.label} delay={i * 100}>
                <Link href={cat.href} className="group block">
                  <div className="relative rounded-2xl overflow-hidden h-48 transition-transform duration-300 group-hover:-translate-y-2"
                    style={{ background: cat.bg, boxShadow: '0 8px 32px rgba(0,0,0,.15)' }}>
                    <div className="web-pattern opacity-[.03]" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <div className="mb-3 text-white/90">{cat.icon}</div>
                      <h3 className="text-xl font-black text-white">{cat.label}</h3>
                      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.55)' }}>{cat.sub}</p>
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: 'rgba(255,255,255,.15)' }}>
                      <ChevronRight size={14} className="text-white" />
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
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>
                  Más vendidos
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-all"
                style={{ color: '#c0392b' }}
              >
                Ver todos <ChevronRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20" style={{ color: '#9b9b93' }}>
              <Package size={48} className="mx-auto mb-4 opacity-40" />
              <p>Sin productos destacados</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link href="/products" className="btn-primary text-sm px-6 py-3">
              Ver catálogo completo <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="section-tag">Ventajas</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>
                Por qué elegirnos
              </h2>
              <p className="mt-3 max-w-lg mx-auto" style={{ color: '#5a5a54' }}>
                Cada producto pasa por control de calidad antes de salir a tu puerta.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield size={26} />,
                title: 'Materiales premium',
                desc: 'Lycra y spandex de primera. Costuras reforzadas para durar en el tiempo.',
                color: '#c0392b',
                bg: 'rgba(192,57,43,.08)',
              },
              {
                icon: <Truck size={26} />,
                title: 'Envíos a todo Chile',
                desc: 'Despacho en 24-48 horas hábiles. Seguimiento en tiempo real.',
                color: '#1a2744',
                bg: 'rgba(26,39,68,.07)',
              },
              {
                icon: <Zap size={26} />,
                title: 'Alta fidelidad',
                desc: 'Diseños cuidadosamente detallados. La experiencia más cercana al original.',
                color: '#d97706',
                bg: 'rgba(217,119,6,.08)',
              },
            ].map((feat, i) => (
              <ScrollReveal key={feat.title} delay={i * 120}>
                <div className="card p-8 group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: feat.bg, color: feat.color }}>
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

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)' }}>
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="section-tag">FAQ</div>
              <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#1a1a18' }}>
                Preguntas frecuentes
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              { q: '¿Cuánto demoran los envíos?', a: 'Los pedidos se despachan en 24-48 horas hábiles. Entrega en 1-3 días en RM y 3-5 días en regiones.' },
              { q: '¿Qué tallas tienen disponibles?', a: 'Disfraces desde talla 100 hasta 190 cm. Las máscaras son talla única con ajuste elástico.' },
              { q: '¿Cuáles son los materiales?', a: 'Lycra/Spandex 95% + 5% Elastano. Tela de alta elasticidad, transpirable y resistente al uso frecuente.' },
              { q: '¿Hacen cambios o devoluciones?', a: 'Aceptamos cambios dentro de 7 días, siempre que el producto esté sin usar. El cliente cubre el envío de cambio.' },
              { q: '¿Cómo hago seguimiento de mi pedido?', a: 'Al confirmar tu compra recibirás un número de orden. Puedes consultarlo directamente en la tienda.' },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <details className="group rounded-2xl overflow-hidden cursor-pointer"
                  style={{ background: '#fff', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                  <summary className="flex items-center justify-between px-6 py-5 list-none font-semibold select-none"
                    style={{ color: '#1a1a18' }}>
                    {faq.q}
                    <ChevronRight size={16} className="shrink-0 ml-4 transition-transform duration-300 group-open:rotate-90"
                      style={{ color: '#c0392b' }} />
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#5a5a54', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    {faq.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#fff' }}>
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="hero-bg relative rounded-3xl overflow-hidden p-12 md:p-20 text-center">
              <div className="web-pattern" />
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(192,57,43,.2), transparent)' }} />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden animate-float" style={{ boxShadow: '0 12px 40px rgba(0,0,0,.3)' }}>
                  <Image src="/logo.jpeg" alt="AracnidaStore" width={80} height={80} className="object-cover" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  ¿Listo para convertirte en el héroe?
                </h2>
                <p className="mb-8 text-lg" style={{ color: 'rgba(255,255,255,.5)' }}>
                  Encuentra tu traje o máscara perfecta hoy.
                </p>
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
