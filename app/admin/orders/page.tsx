import { createAdminClient } from '@/lib/supabase/server'
import {
  formatPrice, formatDate,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/utils'
import { PICKUP_SLOT_LABELS, PICKUP_PLACE, formatPickupDate } from '@/lib/pickup'
import { formatReservationDate, describeReservationDelivery } from '@/lib/reservations'
import { Order } from '@/types'
import { AdminOrderStatusChanger } from '@/components/admin/AdminOrderStatusChanger'
import { AdminPaymentStatusChanger } from '@/components/admin/AdminPaymentStatusChanger'
import { releaseExpiredOrders } from '@/lib/actions/orders'
import { after } from 'next/server'
import Link from 'next/link'
import { ShoppingCart, Truck, Store, Calendar, Clock, Banknote, AlertTriangle, CalendarDays, ArrowRight, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOrders(): Promise<Order[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

interface Filtros { estado?: string; pago?: string; tipo?: string; q?: string }

const soloDigitos = (s: string) => s.replace(/\D/g, '')

/** Aplica los filtros de la URL sobre la lista completa. */
function filtrar(all: Order[], f: Filtros): Order[] {
  const q = (f.q ?? '').trim().toLowerCase()
  const qDigits = soloDigitos(q)
  return all.filter((o) => {
    // "Por gestionar" = todo lo que todavía requiere que hagas algo.
    if (f.estado === 'gestionar') {
      if (o.status === 'cancelado' || o.status === 'entregado') return false
    } else if (f.estado && o.status !== f.estado) return false

    if (f.pago === 'pendiente' && !(o.payment_status === 'pendiente' && o.status !== 'cancelado')) return false
    if (f.pago === 'pagado' && o.payment_status !== 'pagado') return false

    if (f.tipo === 'reserva' && !o.is_reservation) return false
    if (f.tipo === 'envio' && (o.is_reservation || o.delivery_method !== 'delivery')) return false
    if (f.tipo === 'retiro' && (o.is_reservation || o.delivery_method !== 'retiro')) return false

    if (q) {
      const texto = [
        o.id, o.customer_name, o.customer_email, o.delivery_commune, o.coupon_code,
        ...(o.items ?? []).map((i) => i.product_name),
      ].filter(Boolean).join(' ').toLowerCase()
      // El teléfono se compara solo por dígitos: "9 9271 1288" encuentra "+56992711288".
      const telefono = soloDigitos(o.customer_phone ?? '')
      const porTexto = texto.includes(q.replace(/^#/, ''))
      const porTelefono = qDigits.length >= 4 && telefono.includes(qDigits)
      if (!porTexto && !porTelefono) return false
    }
    return true
  })
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const sp = await searchParams
  // La limpieza de checkouts abandonados es mantención, no información que
  // el listado necesite para dibujarse: antes se esperaba a que terminara
  // (una consulta más, y una escritura por cada pedido expirado) ANTES de
  // mostrar nada. Con `after()` se ejecuta una vez despachada la respuesta,
  // así la página aparece de inmediato.
  //
  // El costo es que un pedido que vence justo en este instante se ve como
  // "pendiente" hasta la próxima carga. Es un cambio de un refresco de
  // diferencia, a cambio de sacar la escritura del camino crítico.
  after(releaseExpiredOrders)

  // Los contadores salen de TODOS los pedidos; la lista, de los filtrados.
  const all = await getOrders()
  const orders = filtrar(all, sp)
  const hayFiltros = Boolean(sp.estado || sp.pago || sp.tipo || sp.q)

  const porCobrar = all.filter(
    (o) => o.payment_status === 'pendiente' && o.status !== 'cancelado'
  )
  const totalPorCobrar = porCobrar.reduce((s, o) => s + Number(o.total), 0)

  const byStatus = {
    pendiente: all.filter((o) => o.status === 'pendiente').length,
    confirmado: all.filter((o) => o.status === 'confirmado').length,
    en_preparacion: all.filter((o) => o.status === 'en_preparacion').length,
    en_reparto: all.filter((o) => o.status === 'en_reparto').length,
    entregado: all.filter((o) => o.status === 'entregado').length,
    cancelado: all.filter((o) => o.status === 'cancelado').length,
  }
  const porGestionar = all.filter((o) => o.status !== 'cancelado' && o.status !== 'entregado').length

  // Enlace que cambia un filtro conservando los demás. Tocar el que ya
  // está activo lo quita.
  const link = (key: keyof Filtros, value: string | null) => {
    const next: Filtros = { ...sp }
    if (value === null || next[key] === value) delete next[key]
    else next[key] = value
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString()
    return qs ? `/admin/orders?${qs}` : '/admin/orders'
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap ${
      active ? 'bg-[var(--ink)] text-white border-[var(--ink)]' : 'bg-white text-[var(--gray-600)] border-[var(--gray-200)] hover:border-[var(--gray-400)]'
    }`

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Pedidos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
          {hayFiltros ? `Mostrando ${orders.length} de ${all.length} pedidos` : `${all.length} pedidos en total`}
        </p>
      </div>

      {/* Estados: cada cuadro filtra la lista al tocarlo */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
        {Object.entries(byStatus).map(([status, count]) => (
          <Link key={status} href={link('estado', status)}
            className={`p-3 rounded-xl border text-center transition-shadow ${ORDER_STATUS_COLORS[status]} ${
              sp.estado === status ? 'ring-2 ring-offset-2 ring-[var(--ink)]' : 'hover:shadow-md'
            }`}>
            <p className="text-xl font-black tabular-nums">{count}</p>
            <p className="text-xs mt-0.5">{ORDER_STATUS_LABELS[status]}</p>
          </Link>
        ))}
      </div>

      {/* Buscador y filtros */}
      <div className="card p-4 mb-4 space-y-3">
        <form action="/admin/orders" method="get" className="flex gap-2">
          {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
          {sp.pago && <input type="hidden" name="pago" value={sp.pago} />}
          {sp.tipo && <input type="hidden" name="tipo" value={sp.tipo} />}
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--gray-400)' }} />
            <input name="q" defaultValue={sp.q ?? ''} placeholder="Buscar por nombre, teléfono, correo, n° de pedido o producto"
              className="input-field pl-9" />
          </div>
          <button type="submit" className="btn-dark shrink-0">Buscar</button>
        </form>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <Link href="/admin/orders" className={chip(!hayFiltros)}>Todos</Link>
          <Link href={link('estado', 'gestionar')} className={chip(sp.estado === 'gestionar')}>
            Por gestionar ({porGestionar})
          </Link>
          <Link href={link('pago', 'pendiente')} className={chip(sp.pago === 'pendiente')}>
            Esperando pago ({porCobrar.length})
          </Link>
          <Link href={link('pago', 'pagado')} className={chip(sp.pago === 'pagado')}>Pagados</Link>
          <span className="w-px shrink-0 my-1" style={{ background: 'var(--gray-200)' }} />
          <Link href={link('tipo', 'envio')} className={chip(sp.tipo === 'envio')}>Envíos</Link>
          <Link href={link('tipo', 'retiro')} className={chip(sp.tipo === 'retiro')}>Retiros</Link>
          <Link href={link('tipo', 'reserva')} className={chip(sp.tipo === 'reserva')}>Reservas</Link>
        </div>
      </div>

      {porCobrar.length > 0 && !hayFiltros && (
        <Link href={link('pago', 'pendiente')} className="mb-6 rounded-xl p-4 flex items-center gap-3 border bg-amber-50 border-amber-200">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{porCobrar.length}</strong>{' '}
            {porCobrar.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de cobro por{' '}
            <strong className="tabular-nums">{formatPrice(totalPorCobrar)}</strong>
            <span className="underline ml-1">Ver</span>
          </p>
        </Link>
      )}

      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="card p-12 text-center" style={{ color: 'var(--gray-400)' }}>
            <ShoppingCart size={40} className="mx-auto mb-4" />
            <p>{hayFiltros ? 'Ningún pedido coincide con esos filtros' : 'Sin pedidos aún'}</p>
            {hayFiltros && (
              <Link href="/admin/orders" className="btn-ghost inline-block mt-4 text-sm">Quitar filtros</Link>
            )}
          </div>
        )}
        {orders.map((order) => (
          <div key={order.id} className="card overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs" style={{ color: 'var(--gray-400)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                  {/* Sin esto, una reserva se ve idéntica a un pedido normal en esta
                      lista — y con delivery_method "por_definir" incluso mostraba
                      datos de retiro falsos ("Día no indicado", "Hora no indicada"). */}
                  {order.is_reservation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                      <CalendarDays size={12} /> Reserva
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </span>
                  {!order.is_reservation && (
                    <span className="text-xs px-2 py-0.5 rounded inline-flex items-center gap-1" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                      {order.delivery_method === 'delivery' ? <><Truck size={12} /> Delivery</> : <><Store size={12} /> Retiro</>}
                    </span>
                  )}
                </div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>{order.customer_name}</p>
                <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
                  <span>{order.customer_phone}</span><span>·</span>
                  <span>{order.customer_email}</span><span>·</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(order.total)}</p>
                {order.shipping_cost > 0 && <p className="text-xs" style={{ color: 'var(--gray-400)' }}>+{formatPrice(order.shipping_cost)} envío</p>}
                {order.coupon_code && (
                  <p className="text-xs font-semibold" style={{ color: '#15803d' }}>
                    Cupón {order.coupon_code} · −{formatPrice(order.discount)}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Productos</p>
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--gray-800)' }}>{item.product_name} · Talla {item.size} × {item.quantity}</span>
                      <span className="shrink-0 ml-3 tabular-nums" style={{ color: 'var(--gray-600)' }}>{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.is_reservation ? (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Reserva</p>
                  <div className="text-sm space-y-2" style={{ color: 'var(--gray-600)' }}>
                    <p className="flex items-center gap-2">
                      <CalendarDays size={14} style={{ color: 'var(--gray-400)' }} />
                      <span>Lo necesita el{' '}
                        <strong className="capitalize" style={{ color: 'var(--text)' }}>
                          {order.needed_by ? formatReservationDate(order.needed_by) : 'sin fecha'}
                        </strong>
                      </span>
                    </p>
                    <p style={{ color: 'var(--gray-600)' }}>{describeReservationDelivery(order)}</p>
                    {order.delivery_reference && <p style={{ color: 'var(--gray-400)' }}>Ref: {order.delivery_reference}</p>}
                    <Link href="/admin/reservations" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: 'var(--red)' }}>
                      Gestionar en Reservas <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ) : order.delivery_method === 'delivery' ? (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>Entrega</p>
                  <div className="text-sm space-y-1" style={{ color: 'var(--gray-600)' }}>
                    <p>{order.delivery_address}</p>
                    <p>{order.delivery_commune}</p>
                    {order.delivery_region && <p style={{ color: 'var(--gray-400)' }}>{order.delivery_region}</p>}
                    {order.delivery_reference && <p style={{ color: 'var(--gray-400)' }}>Ref: {order.delivery_reference}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: 'var(--gray-400)' }}>
                    Retiro en {PICKUP_PLACE}
                  </p>
                  <div className="text-sm space-y-2" style={{ color: 'var(--gray-600)' }}>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} style={{ color: 'var(--gray-400)' }} />
                      <span className="font-semibold capitalize" style={{ color: 'var(--text)' }}>
                        {order.pickup_date
                          ? formatPickupDate(order.pickup_date)
                          : order.pickup_slot
                            ? `${PICKUP_SLOT_LABELS[order.pickup_slot] ?? order.pickup_slot} (sin fecha)`
                            : 'Día no indicado'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} style={{ color: 'var(--gray-400)' }} />
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {order.pickup_time ?? 'Hora no indicada'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Banknote size={14} style={{ color: 'var(--gray-400)' }} />
                      {order.payment_method
                        ? PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method
                        : 'Método no indicado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex flex-wrap items-end justify-between gap-4">
              {order.notes && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-100)' }}>
                  Nota: {order.notes}
                </p>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {order.is_reservation ? (
                  // Los cambios de estado de una reserva no pasan por acá:
                  // updateOrderStatus() devuelve/descuenta stock al cancelar o
                  // reactivar, y una reserva nunca descontó stock — usarlo
                  // aquí inflaría el inventario por error. /admin/reservations
                  // tiene su propio control, sin ese efecto secundario.
                  <Link href="/admin/reservations" className="btn-ghost text-xs py-2 px-3 inline-flex items-center gap-1.5">
                    Gestionar estado en Reservas <ArrowRight size={12} />
                  </Link>
                ) : (
                  <>
                    <div>
                      <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Pago</p>
                      <AdminPaymentStatusChanger orderId={order.id} currentStatus={order.payment_status} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-semibold" style={{ color: 'var(--gray-400)' }}>Estado</p>
                      <AdminOrderStatusChanger orderId={order.id} currentStatus={order.status} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
