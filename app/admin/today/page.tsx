import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { formatPickupDate, PICKUP_PLACE } from '@/lib/pickup'
import { describeReservationDelivery } from '@/lib/reservations'
import { Order } from '@/types'
import {
  classify, sortGroup, ageLabel, isPreorder, GROUP_META, GROUP_ORDER,
  type QueueGroup, type QueueItem,
} from '@/lib/work-queue'
import { AdminQueueAction } from '@/components/admin/AdminQueueAction'
import { CopyButton } from '@/components/admin/CopyButton'
import { CheckCircle2, CalendarDays, Rocket, MapPin, Clock, ExternalLink, Ship } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOpenOrders(): Promise<{ orders: Order[]; waiting: Set<string> }> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .not('status', 'in', '(cancelado,entregado)')
    .order('created_at', { ascending: true })
  const orders = (data ?? []) as Order[]

  // Preventas cuyo lote sigue en camino: aún no se puede armar el paquete.
  const ids = orders.filter((o) => o.is_reservation).map((o) => o.id)
  const waiting = new Set<string>()
  if (ids.length) {
    const { data: pre } = await supabase
      .from('order_items')
      .select('order_id, batch:incoming_batches(status)')
      .in('order_id', ids)
      .not('incoming_batch_id', 'is', null)
    for (const r of (pre ?? []) as unknown as { order_id: string; batch: { status: string } | { status: string }[] | null }[]) {
      const b = Array.isArray(r.batch) ? r.batch[0] : r.batch
      if (b?.status === 'en_camino') waiting.add(r.order_id)
    }
  }
  return { orders, waiting }
}

function datosEnvio(o: Order): string {
  return [
    o.customer_name,
    o.customer_phone ? `Tel: ${o.customer_phone}` : '',
    o.customer_email ? `Correo: ${o.customer_email}` : '',
    o.delivery_address ?? '',
    [o.delivery_commune, o.delivery_region].filter(Boolean).join(', '),
    o.delivery_reference ? `Ref: ${o.delivery_reference}` : '',
  ].filter(Boolean).join('\n')
}

function QueueCard({ q }: { q: QueueItem }) {
  const o = q.order
  const meta = GROUP_META[q.group]
  const envio = o.delivery_method === 'delivery'
  const retiro = o.delivery_method === 'retiro'
  const detalle = o.is_reservation ? '/admin/reservations' : `/admin/orders?q=${o.id.slice(0, 8)}`

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-[11px]" style={{ color: 'var(--gray-400)' }}>#{o.id.slice(0, 8).toUpperCase()}</span>
            {o.is_reservation && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {isPreorder(o) ? <><Ship size={11} /> Preventa</> : <><CalendarDays size={11} /> Reserva</>}
              </span>
            )}
            <span className="text-[11px]" style={{ color: 'var(--gray-400)' }}>{ageLabel(q.ageHours)}</span>
          </div>
          <p className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            {o.customer_name}
            <CopyButton text={o.customer_name} title="Copiar nombre" />
          </p>
        </div>
        <p className="text-lg font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(o.total)}</p>
      </div>

      {/* Qué hay que armar */}
      <ul className="mt-3 space-y-1">
        {(o.items ?? []).map((it) => (
          <li key={it.id} className="text-sm flex gap-2" style={{ color: 'var(--gray-800)' }}>
            <span className="font-bold tabular-nums shrink-0" style={{ color: meta.color }}>{it.quantity}×</span>
            <span>{it.product_name}{it.size && it.size !== 'Única' ? <> · <strong>talla {it.size}</strong></> : null}</span>
          </li>
        ))}
      </ul>

      {/* Adónde va */}
      <div className="mt-3 text-sm flex flex-wrap items-start gap-x-4 gap-y-1" style={{ color: 'var(--gray-600)' }}>
        {envio && (
          <span className="inline-flex items-start gap-1.5">
            <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--gray-400)' }} />
            {[o.delivery_address, o.delivery_commune, o.delivery_region].filter(Boolean).join(', ') || 'Sin dirección'}
          </span>
        )}
        {retiro && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} style={{ color: 'var(--gray-400)' }} />
            {o.pickup_date
              ? <span className="capitalize">{formatPickupDate(o.pickup_date)}{o.pickup_time ? ` · ${o.pickup_time}` : ''}</span>
              : 'Día por coordinar'} · {PICKUP_PLACE}
          </span>
        )}
        {o.is_reservation && !envio && !retiro && <span>{describeReservationDelivery(o)}</span>}
        {o.is_reservation && o.needed_by && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} style={{ color: 'var(--gray-400)' }} /> {isPreorder(o) ? 'Llega' : 'Lo necesita'}: {o.needed_by}
          </span>
        )}
      </div>

      {/* Lo que escribió el cliente al comprar (p. ej. una pregunta de talla) */}
      {o.notes && !isPreorder(o) && (
        <p className="mt-3 text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(37,99,235,.07)', color: 'var(--gray-800)' }}>
          <strong>Nota del cliente:</strong> {o.notes}
        </p>
      )}

      {q.alert && (
        <p className="mt-3 text-xs font-semibold rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,.12)', color: '#b45309' }}>
          {q.alert}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AdminQueueAction orderId={o.id} action={q.action} />
        {envio && <CopyButton label="Copiar datos de envío" title="Nombre, teléfono, correo y dirección" text={datosEnvio(o)} />}
        {o.customer_phone && <CopyButton label={o.customer_phone} title="Copiar teléfono" text={o.customer_phone} />}
        <Link href={detalle} className="inline-flex items-center gap-1 text-xs font-semibold ml-auto" style={{ color: 'var(--gray-600)' }}>
          Ver detalle <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}

export default async function AdminTodayPage() {
  const { orders, waiting } = await getOpenOrders()
  // eslint-disable-next-line react-hooks/purity -- página dinámica: se calcula en cada visita
  const now = Date.now()

  const groups = new Map<QueueGroup, QueueItem[]>()
  for (const o of orders) {
    const q = classify(o, now, waiting)
    if (q) groups.set(q.group, [...(groups.get(q.group) ?? []), q])
  }
  const sorted = GROUP_ORDER
    .map((g) => ({ g, items: sortGroup(g, groups.get(g) ?? []) }))
    .filter((x) => x.items.length > 0)

  // "Para hacer" no cuenta lo que solo espera (esperando el traje / en camino al cliente)
  const porHacer = (['cobrar', 'preparar', 'retiros'] as QueueGroup[])
    .reduce((s, g) => s + (groups.get(g)?.length ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Hoy</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          {porHacer > 0
            ? <><strong>{porHacer}</strong> {porHacer === 1 ? 'cosa por hacer' : 'cosas por hacer'}. Pedidos y reservas juntos, lo más urgente arriba.</>
            : 'Todo al día.'}
        </p>
      </div>

      {sorted.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
          {sorted.map(({ g, items }) => (
            <a key={g} href={`#${g}`}
              className="px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-2"
              style={{ background: GROUP_META[g].bg, color: GROUP_META[g].color }}>
              <span className="tabular-nums text-base">{items.length}</span>
              {GROUP_META[g].title}
            </a>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle2 size={44} className="mx-auto mb-3" style={{ color: '#15803d' }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>No tienes nada pendiente</p>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>Cuando entre un pedido, aparecerá aquí.</p>
          <Link href="/admin/orders" className="btn-ghost inline-flex mt-5 text-sm">Ver todos los pedidos</Link>
        </div>
      )}

      <div className="space-y-9">
        {sorted.map(({ g, items }) => {
          const meta = GROUP_META[g]
          // En retiros se separa por día para armar la entrega de cada sábado
          const buckets = new Map<string, QueueItem[]>()
          for (const it of items) {
            const k = g === 'retiros' ? (it.order.pickup_date ?? 'sin-fecha') : 'todo'
            buckets.set(k, [...(buckets.get(k) ?? []), it])
          }
          return (
            <section key={g} id={g} className="scroll-mt-24">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-sm font-black px-2.5 py-1 rounded-lg tabular-nums" style={{ background: meta.bg, color: meta.color }}>
                  {items.length}
                </span>
                <div>
                  <h2 className="font-black leading-tight" style={{ color: 'var(--text)' }}>{meta.title}</h2>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{meta.hint}</p>
                </div>
              </div>

              {[...buckets.entries()].map(([k, list]) => (
                <div key={k} className="mb-4">
                  {g === 'retiros' && (
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 capitalize" style={{ color: meta.color }}>
                      {k === 'sin-fecha' ? 'Día por coordinar' : formatPickupDate(k)}
                    </p>
                  )}
                  <div className="space-y-3">
                    {list.map((q) => <QueueCard key={q.order.id} q={q} />)}
                  </div>
                </div>
              ))}
            </section>
          )
        })}
      </div>

      <p className="text-xs mt-10 flex items-center gap-1.5" style={{ color: 'var(--gray-400)' }}>
        <Rocket size={13} /> Para buscar un pedido por nombre o teléfono, o ver los ya entregados, usa{' '}
        <Link href="/admin/orders" className="underline">Pedidos</Link>.
      </p>
    </div>
  )
}
