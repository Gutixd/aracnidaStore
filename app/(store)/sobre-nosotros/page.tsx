import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, MapPin, Truck, Shield, Heart, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Tienda Spider-Man en Santiago',
  description: 'AracnidaStore es una tienda chilena especializada en disfraces y máscaras de Spider-Man de calidad premium. Despacho a todo Chile y retiro en Metro Plaza de Maipú, Santiago.',
  alternates: { canonical: '/sobre-nosotros' },
  openGraph: {
    title: 'Sobre AracnidaStore — Tienda Spider-Man en Santiago de Chile',
    description: 'Disfraces y máscaras de Spider-Man de calidad premium, hechos para fans. Santiago, Chile.',
    type: 'website',
  },
}

export default function SobreNosotrosPage() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="hero-bg relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="web-pattern" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0,0,0,.3)' }}>
            <Image src="/logo.jpeg" alt="AracnidaStore" width={80} height={80} className="object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Hechos para fans, por fans</h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,.55)' }}>
            Somos una tienda chilena dedicada a los disfraces y máscaras de Spider-Man de calidad premium.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Historia */}
        <div className="card p-8 md:p-10 mb-8">
          <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--text)' }}>Nuestra historia</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'var(--gray-600)' }}>
            <p>
              AracnidaStore nació en <strong>Santiago de Chile</strong> de la pasión por el universo de Spider-Man.
              Sabíamos lo difícil que es encontrar un disfraz que de verdad se vea bien, con buen material y a un
              precio justo, así que decidimos traer los mejores trajes y máscaras directamente a los fans chilenos.
            </p>
            <p>
              Hoy ofrecemos disfraces de <strong>Miles Morales, Tom Holland, Tobey Maguire, Andrew Garfield y Venom</strong>,
              además de una amplia gama de máscaras desde las básicas hasta las <strong>PRO ULTRA</strong> con detalles
              de alta fidelidad. Cada producto pasa por un control de calidad antes de llegar a tus manos.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {[
            { icon: <Shield size={24} />, t: 'Calidad premium', d: 'Tela elástica resistente y estampados detallados que duran.' },
            { icon: <Truck size={24} />, t: 'Envíos a todo Chile', d: 'Despacho en 24-48 horas hábiles, con seguimiento.' },
            { icon: <MapPin size={24} />, t: 'Retiro en Maipú', d: 'Coordina la entrega presencial en Metro Plaza de Maipú.' },
            { icon: <Heart size={24} />, t: 'Atención cercana', d: 'Te ayudamos a elegir la talla y el modelo ideal.' },
          ].map((v) => (
            <div key={v.t} className="card p-6 flex gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
                {v.icon}
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>{v.t}</h3>
                <p className="text-sm" style={{ color: 'var(--gray-600)' }}>{v.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/products" className="btn-primary text-base px-8 py-4">
            <ShoppingBag size={18} /> Ver catálogo completo
          </Link>
          <div className="mt-4">
            <Link href="/guia-de-tallas" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#c0392b' }}>
              Ver guía de tallas <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
