'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export function VideoShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            videoRef.current?.play().catch(() => {})
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '70svh', background: '#0b0b0d' }}
    >
      {/* Video de fondo a pantalla completa */}
      <video
        ref={videoRef}
        src="/video-inicio.mp4"
        muted
        loop
        playsInline
        // Solo empieza a bajar cuando la sección entra en pantalla (el
        // IntersectionObserver de arriba llama a play()); hasta entonces se
        // ve el póster.
        preload="none"
        poster="/video-inicio-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Capas oscuras para legibilidad del texto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(8,8,10,.5) 0%, rgba(8,8,10,.4) 50%, rgba(8,8,10,.75) 100%)' }}
      />

      {/* Contenido encima del video. Siempre visible: antes arrancaba en
          opacidad 0 y dependía de que el observador lo "encendiera". */}
      <div
        className="relative z-10 text-center px-5 sm:px-6 lg:px-8 max-w-3xl mx-auto transition-transform duration-700"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <span className="section-tag" style={{ color: 'rgba(255,255,255,.75)' }}>En acción</span>
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ letterSpacing: '-.04em', lineHeight: 1.02 }}>
          Míralos en movimiento
        </h2>
        <p className="text-base md:text-lg max-w-md mx-auto mb-9" style={{ color: 'rgba(255,255,255,.8)' }}>
          Así se ven nuestros trajes y máscaras de Spider-Man en la vida real.
        </p>
        <Link href="/products" className="inline-flex items-center gap-2 min-h-[48px] px-7 rounded-[10px] text-[15px] font-semibold bg-white transition-colors hover:bg-white/90"
          style={{ color: 'var(--text)' }}>
          <ShoppingBag size={18} />
          Ver catálogo
        </Link>
      </div>
    </section>
  )
}
