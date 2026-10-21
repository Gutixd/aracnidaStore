import Link from 'next/link'
import { PackageCheck, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { formatArrival } from '@/lib/incoming-format'
import type { IncomingAvailability } from '@/lib/incoming'

interface Props {
  slug: string
  price: number
  items: IncomingAvailability[]
}

/**
 * "Llegan pronto": tallas que vienen en camino y se pueden reservar al
 * precio normal. Se agrupan por rango de llegada para que se lea de un
 * vistazo qué llega y cuándo.
 */
export function IncomingSection({ slug, price, items }: Props) {
  if (items.length === 0) return null

  const groups = new Map<string, IncomingAvailability[]>()
  for (const it of items) {
    const k = `${it.arrives_from}|${it.arrives_to}`
    groups.set(k, [...(groups.get(k) ?? []), it])
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <section
      id="en-camino"
      className="mt-6 rounded-[var(--radius)] overflow-hidden scroll-mt-24"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(37,99,235,.22)', background: 'linear-gradient(180deg, rgba(37,99,235,.06), rgba(37,99,235,.015))' }}
    >
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#1d4ed8', color: '#fff' }}>
          <PackageCheck size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-[15px] leading-tight" style={{ color: 'var(--text)' }}>
            Llegan pronto · aparta tu talla
          </h2>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--gray-600)' }}>
            Estos trajes ya vienen en camino. Resérvalo hoy a {formatPrice(price)} y te lo entregamos apenas llegue.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
        {ordered.map(([key, list]) => {
          const { arrives_from, arrives_to } = list[0]
          return (
            <div key={key}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#1d4ed8' }}>
                Llegan {formatArrival(arrives_from, arrives_to)}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {list.map((it) => (
                  <Link
                    key={it.batch_id}
                    href={`/reservar/${slug}?preventa=1&talla=${encodeURIComponent(it.size)}`}
                    className="group rounded-[10px] px-2.5 py-2 text-center transition-colors hover:bg-white"
                    style={{ background: 'rgba(255,255,255,.75)', boxShadow: 'inset 0 0 0 1px var(--gray-200)' }}
                  >
                    <span className="block text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                      {it.size}
                      {/^\d+$/.test(it.size) && <span className="text-[11px] font-normal" style={{ color: 'var(--gray-400)' }}> cm</span>}
                    </span>
                    <span className="block text-[11px] mt-0.5" style={{ color: it.available <= 1 ? '#b45309' : 'var(--gray-600)' }}>
                      {it.available === 1 ? 'Queda 1' : `Quedan ${it.available}`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        <Link
          href={`/reservar/${slug}?preventa=1`}
          className="flex items-center justify-center gap-1.5 w-full min-h-[46px] rounded-[10px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1d4ed8' }}
        >
          Reservar talla en camino <ChevronRight size={16} />
        </Link>
        <p className="text-[11px] text-center" style={{ color: 'var(--gray-400)' }}>
          Pagas el total ahora · sin cobros después · fechas estimadas por el proveedor
        </p>
      </div>
    </section>
  )
}
