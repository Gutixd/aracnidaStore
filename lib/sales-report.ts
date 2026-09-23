/**
 * Reporte de ventas: cálculo puro, sin acceso a la base, para poder probarlo.
 *
 * Criterio de "venta": pedido con pago CONFIRMADO y no cancelado. El panel de
 * Analytics antiguo sumaba todo pedido no cancelado, incluidos los que nunca
 * se pagaron, y por eso inflaba las cifras. Acá solo cuenta plata que entró.
 */

export const TIMEZONE = 'America/Santiago'

export interface ReportItem {
  product_id: string | null
  product_name: string
  size: string | null
  quantity: number
  total_price: number
}

export interface ReportOrder {
  id: string
  created_at: string
  total: number
  status: string
  payment_status: string
  payment_method: string | null
  delivery_method: string
  is_reservation: boolean | null
  items: ReportItem[]
}

export interface Ranked {
  label: string
  units: number
  revenue: number
}

export interface MonthRow {
  month: number // 1-12
  orders: number
  units: number
  revenue: number
}

export interface SalesReport {
  years: number[]
  year: number
  /** null = año completo */
  month: number | null
  months: MonthRow[]
  totals: { orders: number; units: number; revenue: number; avgTicket: number }
  bestMonth: MonthRow | null
  products: Ranked[]
  sizes: Ranked[]
  categories: Ranked[]
  payments: Ranked[]
  channels: Ranked[]
}

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
})

/** Año y mes en hora de Chile: un pedido de las 23:30 del 31 no cae en el mes siguiente. */
export function chileYearMonth(iso: string): { year: number; month: number } {
  const parts = partsFmt.formatToParts(new Date(iso))
  return {
    year: Number(parts.find((p) => p.type === 'year')!.value),
    month: Number(parts.find((p) => p.type === 'month')!.value),
  }
}

export function isRealSale(o: ReportOrder): boolean {
  return o.payment_status === 'pagado' && o.status !== 'cancelado'
}

function paymentLabel(method: string | null): string {
  if (method === 'transferencia') return 'Transferencia'
  if (method === 'efectivo') return 'Efectivo'
  // Mercado Pago guarda la marca de la tarjeta ("master", "visa"…) o el medio.
  if (method) return 'Tarjeta (Mercado Pago)'
  return 'Sin registrar'
}

function channelLabel(o: ReportOrder): string {
  if (o.is_reservation) return 'Reservas'
  return o.delivery_method === 'delivery' ? 'Envío a domicilio' : 'Retiro en Maipú'
}

function bump(map: Map<string, Ranked>, label: string, units: number, revenue: number) {
  const cur = map.get(label) ?? { label, units: 0, revenue: 0 }
  cur.units += units
  cur.revenue += revenue
  map.set(label, cur)
}

const byRevenue = (a: Ranked, b: Ranked) => b.revenue - a.revenue || b.units - a.units
const byUnits = (a: Ranked, b: Ranked) => b.units - a.units || b.revenue - a.revenue

export function buildSalesReport(
  allOrders: ReportOrder[],
  categoryByProduct: Record<string, string>,
  wantedYear: number | null,
  month: number | null
): SalesReport {
  const sales = allOrders.filter(isRealSale).map((o) => ({ o, ...chileYearMonth(o.created_at) }))

  const years = [...new Set(sales.map((s) => s.year))].sort((a, b) => b - a)
  const year = wantedYear && years.includes(wantedYear) ? wantedYear : (years[0] ?? new Date().getFullYear())

  const ofYear = sales.filter((s) => s.year === year)

  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, orders: 0, units: 0, revenue: 0 }))
  for (const { o, month: m } of ofYear) {
    const row = months[m - 1]
    row.orders += 1
    row.revenue += Number(o.total)
    row.units += o.items.reduce((s, it) => s + it.quantity, 0)
  }

  const period = month ? ofYear.filter((s) => s.month === month) : ofYear

  const products = new Map<string, Ranked>()
  const sizes = new Map<string, Ranked>()
  const categories = new Map<string, Ranked>()
  const payments = new Map<string, Ranked>()
  const channels = new Map<string, Ranked>()

  let orders = 0
  let units = 0
  let revenue = 0

  for (const { o } of period) {
    orders += 1
    revenue += Number(o.total)
    const orderUnits = o.items.reduce((s, it) => s + it.quantity, 0)
    units += orderUnits

    bump(payments, paymentLabel(o.payment_method), orderUnits, Number(o.total))
    bump(channels, channelLabel(o), orderUnits, Number(o.total))

    for (const it of o.items) {
      const price = Number(it.total_price)
      bump(products, it.product_name.trim(), it.quantity, price)
      // "Única" es la talla de máscaras y accesorios: no aporta información.
      if (it.size && it.size !== 'Única') bump(sizes, `Talla ${it.size}`, it.quantity, price)
      const cat = (it.product_id && categoryByProduct[it.product_id]) || 'Sin categoría'
      bump(categories, cat, it.quantity, price)
    }
  }

  const bestMonth = months.reduce<MonthRow | null>(
    (best, m) => (m.revenue > 0 && (!best || m.revenue > best.revenue) ? m : best),
    null
  )

  return {
    years,
    year,
    month,
    months,
    totals: { orders, units, revenue, avgTicket: orders ? revenue / orders : 0 },
    bestMonth,
    products: [...products.values()].sort(byRevenue),
    sizes: [...sizes.values()].sort(byUnits),
    categories: [...categories.values()].sort(byRevenue),
    payments: [...payments.values()].sort(byRevenue),
    channels: [...channels.values()].sort(byRevenue),
  }
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
