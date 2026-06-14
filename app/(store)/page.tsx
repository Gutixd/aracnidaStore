import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { formatPrice } from '@/lib/utils'
import { ShoppingBag, Shield, Truck, Star, ChevronRight, Package } from 'lucide-react'

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug)')
    .eq('active', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(4)
  return data ?? []
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b35] via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, #c0392b22 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, #1a274422 0%, transparent 50%)
            `
          }}
        />
        {/* Web pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(192,57,43,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(192,57,43,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-800/30 rounded-full px-4 py-1.5 text-xs text-red-400 font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Nuevos modelos disponibles
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[0.9]">
            <span className="text-white">Viste la</span>
            <br />
            <span
              className="text-gradient-red"
              style={{
                background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              leyenda.
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Trajes y máscaras de araña de calidad premium. Materiales de primera,
            diseños de alta fidelidad. Envíos a todo Chile.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
              style={{
                background: 'linear-gradient(135deg, #c0392b, #a93226)',
                color: 'white',
                fontWeight: 700,
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={18} />
              Ver catálogo
            </Link>
            <Link
              href="/#featured"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-medium"
            >
              Ver destacados
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[
              { value: '100%', label: 'Calidad garantizada' },
              { value: '48h', label: 'Despacho express' },
              { value: '⭐5.0', label: 'Satisfacción' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/30">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section id="featured" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm text-red-500 font-medium mb-2 tracking-wider uppercase">Selección</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Productos destacados</h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-white/30">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>Próximamente productos disponibles</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              Ver catálogo completo <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-red-500 font-medium mb-2 tracking-wider uppercase">¿Por qué elegirnos?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Calidad en cada detalle</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield size={28} />,
                title: 'Materiales premium',
                desc: 'Lycra y spandex de primera calidad. Costuras reforzadas para durabilidad máxima.',
              },
              {
                icon: <Truck size={28} />,
                title: 'Envíos a todo Chile',
                desc: 'Despacho rápido y seguro. Seguimiento en tiempo real de tu pedido.',
              },
              {
                icon: <Star size={28} />,
                title: 'Alta fidelidad',
                desc: 'Diseños cuidadosamente detallados. La experiencia más cercana al original.',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-red-800/20 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:bg-red-800/30 transition-colors">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feat.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-red-500 font-medium mb-2 tracking-wider uppercase">Ayuda</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Preguntas frecuentes</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cuánto demoran los envíos?',
                a: 'Los pedidos se despachan en 24-48 horas hábiles. El tiempo de entrega depende de la ubicación: 1-3 días en RM y 3-5 días en regiones.',
              },
              {
                q: '¿Qué tallas tienen disponibles?',
                a: 'Contamos con tallas XS, S, M, L, XL y XXL para trajes. Las máscaras son de talla única con ajuste elástico. Revisa cada producto para verificar disponibilidad.',
              },
              {
                q: '¿Cuáles son los materiales?',
                a: 'Nuestros trajes están confeccionados en Lycra/Spandex 95% + 5% Elastano. Material de alta elasticidad, transpirable y resistente al uso frecuente.',
              },
              {
                q: '¿Hacen cambios o devoluciones?',
                a: 'Aceptamos cambios dentro de 7 días desde la recepción, siempre que el producto esté sin usar y en su estado original. El cliente cubre el costo del envío de cambio.',
              },
              {
                q: '¿Cómo puedo hacer seguimiento de mi pedido?',
                a: 'Al confirmar tu pedido recibirás un número de seguimiento. Puedes consultar el estado directamente en nuestra tienda con tu número de orden.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none text-white font-medium hover:text-white/80 transition-colors">
                  {faq.q}
                  <ChevronRight size={16} className="text-white/30 group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 text-sm text-white/50 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="relative rounded-3xl overflow-hidden p-12 md:p-16"
            style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1b35 50%, #0a0a0a 100%)' }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(192,57,43,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(192,57,43,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                ¿Listo para vestirte como un héroe?
              </h2>
              <p className="text-white/40 mb-8">Encuentra tu traje perfecto en nuestra tienda.</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl transition-all duration-200 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #c0392b, #a93226)', color: 'white' }}
              >
                <ShoppingBag size={18} />
                Comprar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
