import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Product, ProductVariant } from '@/types'
import { ReservationForm } from '@/components/store/ReservationForm'
import { RESERVATION_MIN_DAYS } from '@/lib/reservations'
import { ChevronRight, CalendarDays, PackageCheck } from 'lucide-react'
import { getIncomingForProduct } from '@/lib/incoming'

const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug), variants:product_variants(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Reserva' }

  return {
    title: `Reservar ${product.name} con 15% de descuento`,
    description: `Reserva ${product.name} con ${RESERVATION_MIN_DAYS} días de anticipación y obtén 15% de descuento. Pagas el total ahora.`,
    // La reserva es un paso del embudo, no una página que deba competir en
    // buscadores con la ficha del producto.
    robots: { index: false, follow: true },
  }
}

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preventa?: string; talla?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const product = await getProduct(slug)
  if (!product) notFound()
  // "Otros" no se reserva: son unidades sueltas.
  if (product.category?.slug === 'otros') notFound()

  // La consulta no garantiza orden, y sin esto las tallas salen mezcladas
  // (140, 150, 190, 100...). Se ordenan por número; "Única" queda al final.
  const variants = ((product.variants ?? []) as ProductVariant[])
    .filter((v) => v.active)
    .sort((a, b) => {
      const na = Number(a.size)
      const nb = Number(b.size)
      if (Number.isNaN(na) && Number.isNaN(nb)) return a.size.localeCompare(b.size)
      if (Number.isNaN(na)) return 1
      if (Number.isNaN(nb)) return -1
      return na - nb
    })

  if (variants.length === 0) notFound()

  // Preventa de trajes en camino (?preventa=1): si ya no queda ninguno, se
  // cae a la reserva normal en vez de mostrar un formulario vacío.
  const incoming = sp.preventa ? await getIncomingForProduct(product.id) : []
  const isPreorder = incoming.length > 0

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }} className="animate-fade-in">
      <div style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }}
        className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="web-pattern" />
        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="text-sm mb-4 flex items-center gap-2 flex-wrap" style={{ color: 'rgba(255,255,255,.45)' }}>
            <Link href="/products" className="hover:underline">Catálogo</Link>
            <ChevronRight size={14} />
            <Link href={`/products/${product.slug}`} className="hover:underline">{product.name}</Link>
            <ChevronRight size={14} />
            <span style={{ color: '#fff' }}>Reservar</span>
          </nav>

          {isPreorder ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3"
                style={{ background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.35)' }}>
                <PackageCheck size={14} style={{ color: '#93c5fd' }} />
                <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>Preventa · trajes en camino</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Reserva tu {product.name.replace('Disfraz ', '')}</h1>
              <p className="mt-2 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,.6)' }}>
                Estos trajes ya vienen en camino. Pagas hoy el precio normal y tu talla queda apartada: te la entregamos apenas llegue.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3"
                style={{ background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.3)' }}>
                <CalendarDays size={14} style={{ color: '#4ade80' }} />
                <span className="text-xs font-bold" style={{ color: '#4ade80' }}>
                  Reserva anticipada · 15% de descuento
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white">Reservar {product.name}</h1>
              <p className="mt-2 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,.6)' }}>
                Reservando con al menos {RESERVATION_MIN_DAYS} días de anticipación pagas un 15% menos.
                Pagas el total ahora para confirmar tu reserva.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ReservationForm
          product={product}
          variants={variants}
          incoming={isPreorder ? incoming : undefined}
          initialSize={sp.talla}
        />
      </div>
    </div>
  )
}
