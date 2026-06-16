'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface GalleryImage {
  url: string
  alt: string
}

interface Props {
  images: GalleryImage[]
  productName: string
}

export function ProductGallery({ images, productName }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const prev = useCallback(() => {
    setLightbox((i) => (i !== null ? (i - 1 + images.length) % images.length : null))
  }, [images.length])

  const next = useCallback(() => {
    setLightbox((i) => (i !== null ? (i + 1) % images.length : null))
  }, [images.length])

  useEffect(() => {
    if (lightbox === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  if (images.length === 0) return null

  return (
    <section className="mt-20 mb-4">
      {/* Header */}
      <div className="flex items-end gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--red)' }}>
            Galería de producto
          </span>
          <h2 className="text-2xl md:text-3xl font-black leading-none" style={{ color: 'var(--text)' }}>
            Fotos reales del traje
          </h2>
        </div>
        <div className="mb-1 text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in transition-transform hover:scale-[1.02]"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,.08)', border: '1.5px solid var(--gray-100)' }}
            aria-label={`Ver foto ${i + 1} de ${productName}`}
          >
            <Image
              src={img.url}
              alt={img.alt || `${productName} foto ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
              style={{ background: 'rgba(5,10,25,.35)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: '#fff' }}>
                <ZoomIn size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(5,10,25,.95)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
            style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.15)' }}
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.15)' }}
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative mx-20 md:mx-28"
            style={{ width: 'min(85vw, 700px)', height: 'min(85vh, 700px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightbox].url}
              alt={images[lightbox].alt || `${productName} foto ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="85vw"
              priority
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.15)' }}
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter + thumbnails strip */}
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-3">
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.45)' }}>
              {lightbox + 1} / {images.length}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center px-6">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightbox(i) }}
                    className="relative rounded-lg overflow-hidden transition-all flex-shrink-0"
                    style={{
                      width: 44, height: 44,
                      border: i === lightbox ? '2px solid #e74c3c' : '2px solid rgba(255,255,255,.15)',
                      opacity: i === lightbox ? 1 : 0.55,
                    }}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="44px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
