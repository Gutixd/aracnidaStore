import type { Metadata } from 'next'
import Link from 'next/link'
import { SizeGuide } from '@/components/store/SizeGuide'
import { Ruler, ChevronRight, ShoppingBag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guía de Tallas de Disfraces Spider-Man',
  description: 'Guía de tallas para disfraces de Spider-Man en Chile: medidas de altura, pecho, cintura y cadera de la talla 100 a la 190 cm. Elige el traje perfecto para niños y adultos.',
  alternates: { canonical: '/guia-de-tallas' },
  openGraph: {
    title: 'Guía de Tallas de Disfraces Spider-Man | AracnidaStore',
    description: 'Medidas completas de la talla 100 a la 190 cm para elegir tu disfraz de Spider-Man.',
    type: 'article',
  },
}

export default function GuiaDeTallasPage() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }} className="pt-28 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="web-pattern" />
        <div className="max-w-3xl mx-auto relative z-10">
          <nav className="text-sm mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,.45)' }}>
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <span style={{ color: 'rgba(255,255,255,.8)' }}>Guía de tallas</span>
          </nav>
          <div className="inline-flex items-center gap-2 text-white/90 mb-2">
            <Ruler size={22} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>Ayuda</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Guía de tallas de disfraces Spider-Man</h1>
          <p className="mt-3 text-sm md:text-base" style={{ color: 'rgba(255,255,255,.55)' }}>
            Encuentra la talla perfecta usando la altura como referencia principal. Todas las medidas están en centímetros.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>¿Cómo elijo mi talla?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
              La forma más segura de acertar es guiarte por la <strong>altura</strong> de la persona. Si estás entre
              dos tallas, te recomendamos elegir la <strong>mayor</strong> para mayor comodidad. Nuestros disfraces son
              de Lycra/Spandex elástico, por lo que se ajustan muy bien al cuerpo.
            </p>
          </div>

          <SizeGuide defaultOpen />

          <div className="rounded-2xl p-5" style={{ background: 'rgba(192,57,43,.06)', border: '1px solid rgba(192,57,43,.15)' }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>¿Y las máscaras?</h3>
            <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
              Todas nuestras máscaras de Spider-Man son <strong>talla única</strong> con ajuste elástico, pensadas para
              adaptarse cómodamente a la mayoría de los tamaños de cabeza.
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/products?category=disfraces" className="btn-primary text-base px-8 py-4">
            <ShoppingBag size={18} /> Ver disfraces disponibles
          </Link>
          <div className="mt-4">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#c0392b' }}>
              Ver todo el catálogo <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
