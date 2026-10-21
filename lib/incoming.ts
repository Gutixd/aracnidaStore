import { createAdminClient } from '@/lib/supabase/server'

/**
 * Trajes "en camino": compras al proveedor que todavía no llegan. Se pueden
 * reservar al precio normal (preventa) y, al llegar, lo que no se reservó
 * pasa al stock.
 *
 * La tabla no tiene políticas públicas (guarda el costo de compra), así que
 * todo se lee desde el servidor con el cliente de servicio.
 */

export interface IncomingBatch {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_cost: number
  arrives_from: string
  arrives_to: string
  status: 'en_camino' | 'recibido' | 'cancelado'
  note: string
  expense_id: string | null
  received_at: string | null
  created_at: string
}

/** Lo que ve el cliente: nunca incluye el costo. */
export interface IncomingAvailability {
  batch_id: string
  variant_id: string
  size: string
  arrives_from: string
  arrives_to: string
  available: number
}

/** Unidades ya reservadas por lote (pedidos no cancelados). */
export async function reservedByBatch(batchIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (batchIds.length === 0) return out
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('order_items')
    .select('incoming_batch_id, quantity, orders!inner(status)')
    .in('incoming_batch_id', batchIds)
    .neq('orders.status', 'cancelado')
  for (const r of (data ?? []) as { incoming_batch_id: string; quantity: number }[]) {
    out.set(r.incoming_batch_id, (out.get(r.incoming_batch_id) ?? 0) + Number(r.quantity))
  }
  return out
}

/**
 * Tallas en camino de un producto con cupos libres, ordenadas por talla y
 * por fecha de llegada (la más próxima primero).
 */
export async function getIncomingForProduct(productId: string): Promise<IncomingAvailability[]> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('incoming_batches')
      .select('id, variant_id, quantity, arrives_from, arrives_to, variant:product_variants(size, active)')
      .eq('product_id', productId)
      .eq('status', 'en_camino')
    const rows = (data ?? []) as unknown as {
      id: string; variant_id: string; quantity: number; arrives_from: string; arrives_to: string
      variant: { size: string; active: boolean } | { size: string; active: boolean }[] | null
    }[]
    const reserved = await reservedByBatch(rows.map((r) => r.id))
    return rows
      .map((r) => {
        const v = Array.isArray(r.variant) ? r.variant[0] : r.variant
        return {
          batch_id: r.id,
          variant_id: r.variant_id,
          size: v?.size ?? '',
          active: v?.active !== false,
          arrives_from: r.arrives_from,
          arrives_to: r.arrives_to,
          available: Math.max(0, r.quantity - (reserved.get(r.id) ?? 0)),
        }
      })
      .filter((r) => r.active && r.available > 0)
      .map((r) => ({
        batch_id: r.batch_id, variant_id: r.variant_id, size: r.size,
        arrives_from: r.arrives_from, arrives_to: r.arrives_to, available: r.available,
      }))
      .sort((a, b) => sizeOrder(a.size) - sizeOrder(b.size) || a.arrives_to.localeCompare(b.arrives_to))
  } catch {
    return []
  }
}

function sizeOrder(s: string) {
  const n = Number(s)
  return Number.isNaN(n) ? 9999 : n
}

export { formatArrival } from '@/lib/incoming-format'
