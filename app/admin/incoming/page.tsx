import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { formatArrival } from '@/lib/incoming-format'
import type { IncomingBatch } from '@/lib/incoming'
import { AdminIncomingForm, type IncomingProductOption } from '@/components/admin/AdminIncomingForm'
import { AdminIncomingActions } from '@/components/admin/AdminIncomingActions'
import { Ship, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Row = IncomingBatch & {
  product: { name: string; slug: string } | null
  variant: { size: string; price: number } | null
}

type Holder = { batch: string; name: string; qty: number; paid: boolean; orderId: string }

function sizeNum(s: string) {
  const n = Number(s)
  return Number.isNaN(n) ? 9999 : n
}

export default async function AdminIncomingPage() {
  const supabase = await createAdminClient()

  const [{ data: batches }, { data: history }, { data: products }] = await Promise.all([
    supabase
      .from('incoming_batches')
      .select('*, product:products(name, slug), variant:product_variants(size, price)')
      .eq('status', 'en_camino')
      .order('arrives_to', { ascending: true }),
    supabase
      .from('incoming_batches')
      .select('*, product:products(name, slug), variant:product_variants(size, price)')
      .neq('status', 'en_camino')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('products')
      .select('id, name, price, active, category:categories(slug), variants:product_variants(id, size, active, price)')
      .eq('active', true)
      .order('name'),
  ])

  const rows = (batches ?? []) as unknown as Row[]
  const ids = rows.map((r) => r.id)

  // Quién reservó cada lote (pedidos no cancelados)
  const { data: items } = ids.length
    ? await supabase
        .from('order_items')
        .select('incoming_batch_id, quantity, order:orders!inner(id, customer_name, payment_status, status)')
        .in('incoming_batch_id', ids)
        .neq('order.status', 'cancelado')
    : { data: [] }
  const holders: Holder[] = ((items ?? []) as unknown as {
    incoming_batch_id: string; quantity: number
    order: { id: string; customer_name: string; payment_status: string } | { id: string; customer_name: string; payment_status: string }[]
  }[]).map((i) => {
    const o = Array.isArray(i.order) ? i.order[0] : i.order
    return { batch: i.incoming_batch_id, name: o.customer_name, qty: Number(i.quantity), paid: o.payment_status === 'pagado', orderId: o.id }
  })
  const reservedOf = (id: string) => holders.filter((h) => h.batch === id).reduce((s, h) => s + h.qty, 0)

  // KPIs
  const totalUnits = rows.reduce((s, r) => s + r.quantity, 0)
  const totalReserved = rows.reduce((s, r) => s + reservedOf(r.id), 0)
  const saleValue = rows.reduce((s, r) => s + r.quantity * Number(r.variant?.price ?? 0), 0)
  const estProfit = rows.reduce((s, r) => s + r.quantity * (Number(r.variant?.price ?? 0) - r.unit_cost), 0)

  // Agrupado: traje → rango de llegada → tallas
  const byProduct = new Map<string, { name: string; slug: string; groups: Map<string, Row[]> }>()
  for (const r of rows) {
    const p = byProduct.get(r.product_id) ?? { name: r.product?.name ?? 'Producto', slug: r.product?.slug ?? '', groups: new Map() }
    const k = `${r.arrives_from}|${r.arrives_to}`
    p.groups.set(k, [...(p.groups.get(k) ?? []), r])
    byProduct.set(r.product_id, p)
  }

  const options: IncomingProductOption[] = ((products ?? []) as unknown as {
    id: string; name: string; price: number
    category: { slug: string } | { slug: string }[] | null
    variants: { id: string; size: string; active: boolean; price: number }[]
  }[])
    .filter((p) => (Array.isArray(p.category) ? p.category[0]?.slug : p.category?.slug) !== 'otros')
    .map((p) => {
      const vs = (p.variants ?? []).filter((v) => v.active).sort((a, b) => sizeNum(a.size) - sizeNum(b.size))
      return {
        id: p.id,
        name: p.name,
        price: vs.length ? Math.min(...vs.map((v) => Number(v.price))) : Number(p.price),
        variants: vs.map((v) => ({ id: v.id, size: v.size })),
      }
    })
    .filter((p) => p.variants.length > 0)
    // Los disfraces primero: es lo que se compra en tandas
    .sort((a, b) => Number(b.name.startsWith('Disfraz')) - Number(a.name.startsWith('Disfraz')) || a.name.localeCompare(b.name))

  const hist = (history ?? []) as unknown as Row[]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Trajes en camino</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--gray-600)' }}>
          Lo que ya compraste y todavía no llega. Aparece en la ficha de cada traje para que los clientes lo reserven al precio normal.
          Cuando llegue, toca <strong>Llegó</strong>: lo reservado se entrega a esos clientes y el resto pasa al stock.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Trajes en camino', value: String(totalUnits) },
          { label: 'Ya reservados', value: `${totalReserved} de ${totalUnits}` },
          { label: 'Valor de venta', value: formatPrice(saleValue) },
          { label: 'Ganancia estimada', value: formatPrice(estProfit) },
        ].map((k) => (
          <div key={k.label} className="stat-card">
            <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>{k.label}</p>
            <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">
        <AdminIncomingForm products={options} />

        <div className="space-y-4">
          {byProduct.size === 0 ? (
            <div className="card p-10 text-center">
              <Ship size={36} className="mx-auto mb-3" style={{ color: 'var(--gray-200)' }} />
              <p className="font-semibold" style={{ color: 'var(--text)' }}>No hay trajes en camino</p>
              <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Cuando hagas una compra, agrégala con el formulario.</p>
            </div>
          ) : (
            [...byProduct.entries()].map(([pid, p]) => (
              <div key={pid} className="card overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <h2 className="font-bold" style={{ color: 'var(--text)' }}>{p.name}</h2>
                  {p.slug && (
                    <Link href={`/products/${p.slug}#en-camino`} target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: 'var(--gray-600)' }}>
                      Ver en la tienda <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
                {[...p.groups.entries()].map(([key, list]) => (
                  <div key={key} className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#1d4ed8' }}>
                      Llega entre el {formatArrival(list[0].arrives_from, list[0].arrives_to)}
                    </p>
                    {list
                      .sort((a, b) => sizeNum(a.variant?.size ?? '') - sizeNum(b.variant?.size ?? ''))
                      .map((r) => {
                        const res = reservedOf(r.id)
                        const libres = r.quantity - res
                        const price = Number(r.variant?.price ?? 0)
                        const who = holders.filter((h) => h.batch === r.id)
                        return (
                          <div key={r.id} className="rounded-xl p-3 sm:p-4" style={{ background: 'var(--gray-50)' }}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
                              <p className="font-bold" style={{ color: 'var(--text)' }}>
                                Talla {r.variant?.size} · <span className="tabular-nums">{r.quantity}</span> {r.quantity === 1 ? 'unidad' : 'unidades'}
                              </p>
                              <p className="text-xs tabular-nums" style={{ color: 'var(--gray-600)' }}>
                                Costo {formatPrice(r.unit_cost)} · gana {formatPrice(price - r.unit_cost)} c/u
                              </p>
                            </div>
                            {/* Barra: reservados vs libres */}
                            <div className="h-2 rounded-full overflow-hidden flex mb-1.5" style={{ background: '#e5e7eb' }}>
                              <span style={{ width: `${(res / r.quantity) * 100}%`, background: '#1d4ed8' }} />
                            </div>
                            <p className="text-xs mb-3" style={{ color: 'var(--gray-600)' }}>
                              <strong style={{ color: '#1d4ed8' }}>{res} reservado{res === 1 ? '' : 's'}</strong> · {libres} libre{libres === 1 ? '' : 's'}
                              {who.length > 0 && (
                                <> · {who.map((h, i) => (
                                  <span key={h.orderId + i}>
                                    {i > 0 && ', '}
                                    {h.name}{h.qty > 1 ? ` ×${h.qty}` : ''}{!h.paid && ' (sin pagar)'}
                                  </span>
                                ))}</>
                              )}
                            </p>
                            <AdminIncomingActions
                              batchId={r.id}
                              label={`${p.name} talla ${r.variant?.size}`}
                              quantity={r.quantity}
                              reserved={res}
                              from={r.arrives_from}
                              to={r.arrives_to}
                            />
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            ))
          )}

          {hist.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Historial</h3>
              <ul className="space-y-1.5 text-sm">
                {hist.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3" style={{ color: 'var(--gray-600)' }}>
                    <span>{r.product?.name} · talla {r.variant?.size} × {r.quantity}</span>
                    <span className="shrink-0 text-xs font-semibold" style={{ color: r.status === 'recibido' ? '#15803d' : 'var(--gray-400)' }}>
                      {r.status === 'recibido'
                        ? `Llegó ${r.received_at ? new Date(r.received_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' }) : ''}`
                        : 'Cancelado'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
