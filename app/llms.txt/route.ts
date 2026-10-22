import { createPublicClient } from '@/lib/supabase/server'
import { FREE_SHIPPING_THRESHOLD, MIN_SHIPPING_COST } from '@/lib/shipping'
import { PICKUP_PLACE } from '@/lib/pickup'

// Sin ISR (se cobra): la CDN guarda la respuesta 1 h con el Cache-Control de abajo.
export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'
const clp = (n: number) => `$${n.toLocaleString('es-CL')}`

// Resumen de la tienda en texto plano para asistentes de IA (llms.txt).
// Los productos y precios salen de la base de datos, así que no se desactualizan.
export async function GET() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('name, slug, price, description, category:categories(name)')
    .eq('active', true)
    .order('created_at', { ascending: false })

  const products = (data ?? []) as unknown as {
    name: string; slug: string; price: number; description: string | null
    category: { name: string } | { name: string }[] | null
  }[]
  const catName = (c: (typeof products)[number]['category']) =>
    (Array.isArray(c) ? c[0]?.name : c?.name) ?? 'Otros'

  const groups = new Map<string, string[]>()
  for (const p of products) {
    const line = `- [${p.name}](${SITE_URL}/products/${p.slug}): desde ${clp(p.price)}${
      p.description ? `. ${p.description.replace(/\s+/g, ' ').slice(0, 140)}` : ''
    }`
    const k = catName(p.category)
    groups.set(k, [...(groups.get(k) ?? []), line])
  }

  const body = `# AracnidaStore

> Tienda chilena de disfraces y máscaras de Spider-Man (Tom Holland, Miles Morales, Venom, Tobey Maguire, Gwen Stacy y más), con tallas infantiles y adultas, más peluches y accesorios de Sanrio y K-pop. Despachos a todo Chile desde Santiago y retiro gratis en ${PICKUP_PLACE} los sábados.

## Datos clave
- País y moneda: Chile, pesos chilenos (CLP).
- Tallas de disfraz: por estatura en cm (100 a 190). Máscaras: talla única.
- Envío: a todo Chile con Blue Express, desde ${clp(MIN_SHIPPING_COST)} según la región. Envío gratis desde ${clp(FREE_SHIPPING_THRESHOLD)} en la zona centro.
- Retiro: gratis en ${PICKUP_PLACE}, solo sábados, avisando con 24 horas de anticipación.
- Pago: Mercado Pago (tarjetas y transferencia).
- Reservas: los trajes agotados se pueden reservar con pago anticipado, descuento y 15 días de anticipación.
- Cambios: dentro de 7 días corridos desde la recepción, producto sin uso; el envío de devolución lo paga el cliente.
- Contacto: Instagram y WhatsApp indicados en el sitio.

## Páginas principales
- [Catálogo completo](${SITE_URL}/products)
- [Disfraces](${SITE_URL}/products?category=disfraces)
- [Máscaras](${SITE_URL}/products?category=mascaras)
- [Otros: peluches y accesorios](${SITE_URL}/products?category=otros)
- [Guía de tallas de disfraces](${SITE_URL}/guia-de-tallas)
- [Guía de máscaras: básica, Standard y PRO ULTRA](${SITE_URL}/guia-de-mascaras)
- [Términos, envíos y devoluciones](${SITE_URL}/terminos)
- [Privacidad](${SITE_URL}/privacidad)

## Productos
${[...groups.entries()].map(([k, l]) => `### ${k}\n${l.join('\n')}`).join('\n\n')}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
