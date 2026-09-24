'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ChevronRight } from 'lucide-react'

const HERO_SHOWCASE = [
  { src: '/products/disfraz-miles-morales.jpg', alt: 'Disfraz Spider-Man Miles Morales', href: '/products/disfraz-miles-morales' },
  { src: '/products/disfraz-tom-holland.jpg', alt: 'Disfraz Spider-Man Tom Holland', href: '/products/disfraz-tom-holland' },
  { src: '/products/disfraz-venom.jpg', alt: 'Disfraz Spider-Man Venom', href: '/products/disfraz-venom' },
  { src: '/products/mascara-miles-morales-pro.jpg', alt: 'Máscara Miles Morales PRO ULTRA', href: '/products/mascara-miles-morales-pro' },
]

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  return (
    <section className="relative min-h-[100svh] flex items-end lg:items-center overflow-hidden" style={{ background: '#0b0b0d' }}>
      {/* Video de fondo */}
      <video
        ref={videoRef}
        src="/video-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        // "auto" hacía que el navegador bajara el video casi entero apenas
        // cargaba la página. El póster (53 KB) se ve al instante y el video
        // (ya comprimido de 15 MB a 3 MB) entra por streaming al reproducir.
        preload="metadata"
        poster="/video-hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* Overlay: oscuro y parejo, más denso abajo en celular (donde va el
          texto). Antes el título quedaba grisáceo sobre las zonas claras del
          video; ahora el blanco se lee nítido en cualquier cuadro. */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(180deg, rgba(8,8,10,.55) 0%, rgba(8,8,10,.45) 40%, rgba(8,8,10,.85) 100%)' }} />

      {/* Contenido */}
      <div className="relative w-full" style={{ zIndex: 3 }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-36 pb-16 lg:pb-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Texto */}
            <div className="text-left">
              <p className="text-xs font-semibold uppercase mb-6"
                style={{ color: 'rgba(255,255,255,.7)', letterSpacing: '.18em' }}>
                Tienda chilena · Envíos a todo Chile
              </p>

              {/* El H1 antes era puro branding ("Viste la leyenda.") sin ninguna
                  palabra clave real. Google usa el H1 como la señal más fuerte
                  del tema de la página, así que ahora incluye "traje de
                  Spider-Man" de forma natural sin perder el tono de marca. */}
              <h1 className="text-[2.75rem] leading-[1] sm:text-6xl md:text-7xl font-extrabold mb-6"
                style={{ letterSpacing: '-.045em', color: '#fff' }}>
                Trajes de Spider-Man
                <span className="block" style={{ color: '#ff4a43' }}>para vivir la leyenda.</span>
              </h1>

              <p className="text-base sm:text-lg max-w-md mb-9 leading-relaxed"
                style={{ color: 'rgba(255,255,255,.82)' }}>
                Disfraces y máscaras de calidad premium, despachados desde Santiago a todo Chile.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products" className="btn-primary justify-center text-base px-8">
                  <ShoppingBag size={18} />
                  Ver catálogo
                </Link>
                <Link href="#featured"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-6 rounded-[10px] text-[15px] font-semibold transition-colors hover:bg-white/10"
                  style={{ color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)' }}>
                  Ver destacados <ChevronRight size={16} />
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex gap-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.15)' }}>
                {[
                  { value: '+500', label: 'Clientes' },
                  { value: '24-48h', label: 'Despacho' },
                  { value: '7 días', label: 'Para cambios' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xl sm:text-2xl font-bold text-white tabular-nums" style={{ letterSpacing: '-.03em' }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.6)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase de fotos: solo escritorio. En celular alargaba el hero
                y empujaba el catálogo hacia abajo. */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {HERO_SHOWCASE.map((item, i) => (
                  <Link key={item.src} href={item.href}
                    className={`group relative block rounded-2xl overflow-hidden aspect-[3/4] ${i % 2 === 1 ? 'mt-8' : ''}`}
                    style={{ boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}>
                    <Image src={item.src} alt={item.alt} fill sizes="22vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.4), transparent 55%)' }} />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
