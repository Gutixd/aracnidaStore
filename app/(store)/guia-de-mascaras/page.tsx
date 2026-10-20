import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, ShoppingBag, Sparkles } from 'lucide-react'
import { safeJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Guía de Máscaras de Spider-Man: Básica, Standard y PRO ULTRA',
  description: 'Diferencias entre las máscaras de Spider-Man de AracnidaStore: básica con ojos manuales, Standard con control remoto en anillo y PRO ULTRA con lentes termoformados. Talla única.',
  alternates: { canonical: '/guia-de-mascaras' },
  openGraph: {
    title: 'Guía de Máscaras de Spider-Man | AracnidaStore',
    description: 'Básica, Standard o PRO ULTRA: qué incluye cada máscara y cuál elegir.',
    type: 'article',
  },
}

const TIPOS = [
  {
    nombre: 'Básica',
    ojos: 'Mecanismo manual: al estirar la barbilla hacia abajo, los ojos se entrecierran.',
    incluye: 'Tela elástica suave de alta densidad.',
    ideal: 'Para quien quiere una máscara simple y económica.',
    modelos: 'Roja, Negra y Roja y Negra.',
  },
  {
    nombre: 'Standard',
    ojos: 'Anillo con control remoto: con sus botones se cierran y mueven los ojos sin hacer gestos.',
    incluye: 'Lentes integrados, tela elástica de calidad, control remoto y anillo.',
    ideal: 'Para quien quiere animar los ojos con precisión.',
    modelos: 'Tom Holland roja, Miles Morales y Negra Completa (simbionte).',
  },
  {
    nombre: 'PRO ULTRA',
    ojos: 'Anillo con control remoto con botones para cerrar y animar los ojos de forma precisa.',
    incluye: 'Lentes termoformados, acabado profesional, tela elástica de alta densidad, control remoto y anillo.',
    ideal: 'Para coleccionistas y quienes buscan la versión más fiel.',
    modelos: 'Miles Morales y Tobey Maguire.',
  },
]

const FAQ = [
  { q: '¿Qué talla tienen las máscaras?', a: 'Todas las máscaras son talla única con ajuste elástico, pensadas para adaptarse a la mayoría de los tamaños de cabeza.' },
  { q: '¿Cuál es la diferencia entre una máscara básica y una Standard?', a: 'La básica mueve los ojos de forma manual estirando la barbilla hacia abajo. La Standard incluye un anillo con control remoto con el que cierras y mueves los ojos con botones.' },
  { q: '¿Qué tiene de distinto la PRO ULTRA?', a: 'Tiene lentes termoformados y un acabado profesional, además del anillo con control remoto. Es la versión más fiel al personaje.' },
  { q: '¿Las máscaras incluyen el control remoto?', a: 'Las Standard y PRO ULTRA incluyen control remoto y anillo. Las básicas no lo llevan: sus ojos se accionan a mano.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function GuiaDeMascarasPage() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }} className="pt-28 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="web-pattern" />
        <div className="max-w-3xl mx-auto relative z-10">
          <nav className="text-sm mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,.45)' }}>
            <Link href="/" className="hover:underline">Inicio</Link>
            <span>/</span>
            <span style={{ color: 'rgba(255,255,255,.8)' }}>Guía de máscaras</span>
          </nav>
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles size={22} className="text-white/90" />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>Ayuda</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Guía de máscaras de Spider-Man</h1>
          <p className="mt-3 text-sm md:text-base" style={{ color: 'rgba(255,255,255,.55)' }}>
            Básica, Standard o PRO ULTRA: qué incluye cada una y cuál te conviene. Todas son talla única.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {TIPOS.map((t) => (
          <section key={t.nombre} className="card p-6 md:p-8">
            <h2 className="text-xl font-black mb-3" style={{ color: 'var(--text)' }}>Máscara {t.nombre}</h2>
            <dl className="text-sm space-y-2" style={{ color: 'var(--gray-600)' }}>
              <div><dt className="inline font-bold">Ojos: </dt><dd className="inline">{t.ojos}</dd></div>
              <div><dt className="inline font-bold">Incluye: </dt><dd className="inline">{t.incluye}</dd></div>
              <div><dt className="inline font-bold">Modelos: </dt><dd className="inline">{t.modelos}</dd></div>
              <div><dt className="inline font-bold">Ideal para: </dt><dd className="inline">{t.ideal}</dd></div>
            </dl>
          </section>
        ))}

        <section className="card p-6 md:p-8">
          <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text)' }}>Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{f.q}</h3>
                <p className="text-sm" style={{ color: 'var(--gray-600)' }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link href="/products?category=mascaras" className="btn-primary text-base px-8 py-4">
            <ShoppingBag size={18} /> Ver máscaras disponibles
          </Link>
          <div className="mt-4">
            <Link href="/guia-de-tallas" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#c0392b' }}>
              Guía de tallas de disfraces <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
