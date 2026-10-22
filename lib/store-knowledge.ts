import type { SupabaseClient } from '@supabase/supabase-js'
import { PICKUP_PLACE, PICKUP_LEAD_HOURS } from '@/lib/pickup'
import { MIN_SHIPPING_COST } from '@/lib/shipping'
import { RESERVATION_MIN_DAYS } from '@/lib/reservations'
import { formatArrival } from '@/lib/incoming-format'

const SITE = 'https://aracnidastore.com'
const clp = (n: number) => `$${Number(n).toLocaleString('es-CL')}`

/**
 * Lo que un asistente (chat del sitio o Instagram) sabe de la tienda, armado
 * en cada consulta desde la base: catálogo con stock POR TALLA, trajes en
 * camino y políticas. Nada sale de la "memoria" del modelo, así que no puede
 * prometer stock, precios ni plazos que no existen.
 *
 * Nunca incluye costos de compra ni datos de clientes.
 */
export async function buildStoreKnowledge(supabase: SupabaseClient): Promise<string> {
  const [{ data: products }, { data: incoming }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, stock, color, category:categories(name, slug), variants:product_variants(size, stock, price, active)')
      .eq('active', true)
      .order('price'),
    // Solo se puede leer con el cliente de servidor; con la llave pública
    // devuelve vacío y simplemente no se mencionan los trajes en camino.
    supabase
      .from('incoming_batches')
      .select('product_id, quantity, arrives_from, arrives_to, variant:product_variants(size)')
      .eq('status', 'en_camino'),
  ])

  type Row = {
    id: string; name: string; slug: string; price: number; stock: number; color: string | null
    category: { name: string; slug: string } | { name: string; slug: string }[] | null
    variants: { size: string; stock: number; price: number; active: boolean }[] | null
  }
  const num = (s: string) => (Number.isNaN(Number(s)) ? 9999 : Number(s))

  const enCamino = new Map<string, string[]>()
  for (const b of (incoming ?? []) as unknown as {
    product_id: string; quantity: number; arrives_from: string; arrives_to: string
    variant: { size: string } | { size: string }[] | null
  }[]) {
    const v = Array.isArray(b.variant) ? b.variant[0] : b.variant
    const line = `talla ${v?.size} (${b.quantity}) llega ${formatArrival(b.arrives_from, b.arrives_to)}`
    enCamino.set(b.product_id, [...(enCamino.get(b.product_id) ?? []), line])
  }

  const catalogo = ((products ?? []) as unknown as Row[])
    .map((p) => {
      const cat = Array.isArray(p.category) ? p.category[0] : p.category
      const vs = (p.variants ?? []).filter((v) => v.active).sort((a, b) => num(a.size) - num(b.size))
      const tallas = vs.length > 1
        ? vs.map((v) => `${v.size}: ${v.stock > 0 ? `${v.stock} disp.` : 'agotada'}`).join(', ')
        : (p.stock > 0 ? `${p.stock} disponible${p.stock === 1 ? '' : 's'}` : 'AGOTADO')
      const precio = vs.length ? Math.min(...vs.map((v) => Number(v.price))) : p.price
      const camino = enCamino.get(p.id)
      return `- ${p.name} [${cat?.name ?? 'producto'}] ${clp(precio)} · ${SITE}/products/${p.slug}
  Stock: ${tallas}${camino ? `
  En camino (se puede reservar al precio normal desde la ficha): ${camino.join('; ')}` : ''}`
    })
    .join('\n')

  return `
CATÁLOGO ACTUAL (única fuente de verdad para precios y stock — si un producto no está en esta lista, no existe o no está disponible):
${catalogo || '(sin productos activos en este momento)'}

TALLAS DE DISFRACES (por altura, en cm):
XS/100: 90-100cm · S/110: 100-110cm · M/120: 110-120cm · L/130: 120-130cm · XL/140: 130-140cm · 160: 150-160cm · 170: 160-170cm · 180: 170-180cm · 190: 180-190cm
Si está entre dos tallas, recomendar la mayor. Las máscaras son talla única elástica.

ENVÍOS Y RETIRO:
- Envío a domicilio por Blue Express a todo Chile, desde $${MIN_SHIPPING_COST.toLocaleString('es-CL')} según la región (se calcula y muestra en el checkout).
- Región Metropolitana: 1 a 3 días hábiles. Zona centro y sur (Valparaíso a La Araucanía): 3 a 7 días hábiles. Zonas extremas (Arica, Tarapacá, Antofagasta, Atacama, Los Ríos, Los Lagos, Aysén, Magallanes): 7 a 12 días hábiles.
- Retiro gratis en ${PICKUP_PLACE}: solo sábado 11:00-15:00, coordinando con al menos ${PICKUP_LEAD_HOURS} horas de anticipación.

PAGO:
- Envío a domicilio: Mercado Pago (tarjeta de crédito o débito) o transferencia bancaria directa. Si Mercado Pago rechaza la tarjeta, se puede pagar por transferencia: el pedido queda reservado y se despacha al confirmar el pago.
- Retiro en persona: efectivo o transferencia bancaria directa al momento del retiro.

RESERVA ANTICIPADA (sirve incluso para productos AGOTADOS):
- Se reserva desde la ficha del producto, botón "Resérvalo".
- Requiere al menos ${RESERVATION_MIN_DAYS} días de anticipación respecto a la fecha en que lo necesita.
- Tiene 15% de descuento sobre el precio normal.
- Se paga el 100% al reservar (Mercado Pago o transferencia); no queda saldo pendiente.
- Al reservar el cliente elige envío a domicilio (se paga el envío junto con la reserva, sin descuento sobre el envío) o retiro gratis en ${PICKUP_PLACE}. Cuando llega el producto se despacha o se coordina el retiro.

CAMBIOS Y DEVOLUCIONES:
- 7 días corridos desde la recepción, producto sin usar, con etiquetas, en su embalaje original, y con el número de orden. El cliente cubre el envío de la devolución.

OTROS DATOS:
- Los precios están en pesos chilenos (CLP) e incluyen IVA.
- Los pedidos con pago en línea que no se completan en 45 minutos se cancelan y el stock se libera.
- Es una tienda de disfraces y máscaras de cosplay inspirados en Spider-Man (Marvel/Disney), no productos oficiales de Marvel.
`.trim()
}
