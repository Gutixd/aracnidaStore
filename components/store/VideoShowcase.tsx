'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Play } from 'lucide-react'

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
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, #0f1e3d 0%, #1a2744 100%)' }}
    >
      <div className="web-pattern" />
      {/* Glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 45% at 50% 50%, rgba(192,57,43,.22), transparent 70%)' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <div className="section-tag" style={{ color: '#f87171' }}>En acción</div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-3">Míralos en movimiento</h2>
          <p className="text-base md:text-lg max-w-xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,.55)' }}>
            Así se ven nuestros trajes y máscaras de Spider-Man en la vida real.
          </p>
        </div>

        {/* Video frame */}
        <div
          className="relative mx-auto rounded-3xl overflow-hidden transition-all duration-1000"
          style={{
            maxWidth: 720,
            boxShadow: '0 30px 80px rgba(0,0,0,.55)',
            border: '1px solid rgba(255,255,255,.12)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(.92)',
          }}
        >
          <video
            ref={videoRef}
            src="/video-inicio.mp4"
            muted
            loop
            playsInline
            preload="metadata"
            poster="/products/disfraz-miles-morales.jpg"
            className="w-full h-auto block"
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(15,30,61,.25), transparent 40%)' }} />
        </div>

        <div
          className="mt-10 transition-all duration-700 delay-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <Link href="/products" className="btn-primary text-base px-8 py-4">
            <ShoppingBag size={18} />
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  )
}
