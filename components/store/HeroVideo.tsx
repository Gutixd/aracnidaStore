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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video de fondo */}
      <video
        ref={videoRef}
        src="/video-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* Overlay oscuro para legibilidad del texto */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'linear-gradient(135deg, rgba(5,10,25,.65) 0%, rgba(5,10,25,.35) 55%, rgba(5,10,25,.5) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'radial-gradient(ellipse 60% 50% at 75% 50%, rgba(192,57,43,.15) 0%, transparent 65%)' }} />

      {/* Web pattern */}
      <div className="web-pattern" style={{ zIndex: 2 }} />

      {/* Floating rings */}
      <div className="absolute top-1/4 right-[6%] w-72 h-72 rounded-full opacity-10 animate-spin-slow pointer-events-none"
        style={{ zIndex: 2, border: '1px solid rgba(192,57,43,.5)', borderStyle: 'dashed' }} />
      <div className="absolute bottom-1/4 left-[6%] w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ zIndex: 2, border: '1px solid rgba(255,255,255,.3)', borderStyle: 'dashed' }} />

      {/* Contenido */}
      <div className="relative w-full" style={{ zIndex: 3 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Texto */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 animate-fade-in"
                style={{ background: 'rgba(192,57,43,.15)', color: '#f87171', border: '1px solid rgba(192,57,43,.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Nuevos modelos · Envíos a todo Chile
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-none animate-fade-in">
                <span className="text-white block">Viste la</span>
                <span className="block mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #f87171 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                  leyenda.
                </span>
              </h1>

              <p className="text-lg md:text-xl max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-in"
                style={{ color: 'rgba(255,255,255,.6)', animationDelay: '200ms' }}>
                Disfraces y máscaras de Spider-Man de calidad premium en Santiago.
                Materiales de primera y diseños de alta fidelidad.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in"
                style={{ animationDelay: '300ms' }}>
                <Link href="/products" className="btn-primary text-base px-8 py-4">
                  <ShoppingBag size={18} />
                  Ver catálogo completo
                </Link>
                <Link href="#featured" className="flex items-center gap-2 text-sm font-semibold transition-all"
                  style={{ color: 'rgba(255,255,255,.5)' }}>
                  Ver destacados <ChevronRight size={16} />
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 animate-fade-in"
                style={{ animationDelay: '500ms' }}>
                {[
                  { value: '14+', label: 'Modelos' },
                  { value: '48h', label: 'Despacho' },
                  { value: '★ 5.0', label: 'Reseñas' },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.35)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase de fotos */}
            <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="grid grid-cols-2 gap-4">
                {HERO_SHOWCASE.map((item, i) => (
                  <Link key={item.src} href={item.href}
                    className={`group relative block rounded-3xl overflow-hidden aspect-[3/4] ${i % 2 === 1 ? 'mt-8' : ''}`}
                    style={{ boxShadow: '0 20px 50px rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.08)' }}>
                    <Image src={item.src} alt={item.alt} fill sizes="(max-width:1024px) 45vw, 22vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105" priority={i < 2} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,30,61,.55), transparent 55%)' }} />
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
