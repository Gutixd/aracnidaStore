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
  /** Costo unitario congelado al momento de la venta */
  unit_cost?: number | null
}

export interface ReportExpense {
  amount: number
  category: string
  created_at: string
}

export interface ReportOrder {
  id: string
  created_at: string
  total: number
  shipping_cost?: number | null
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

/**
 * Ganancia de un período.
 *
 * - productSales: lo cobrado por productos (total − envío; ya descuenta
 *   cupones y el 15% de las reservas). El envío se trata como traspaso: lo
 *   que se cobra de envío se le paga al courier, no es ganancia.
 * - cost: lo que costaron los productos vendidos (costo congelado al vender).
 * - opExpenses: gastos operativos del mes (marketing, operación, otros).
 * - profit = productSales − cost − opExpenses.
 *
 * Las compras de stock ("inventario") NO se restan de la ganancia: ya están
 * representadas en `cost` cuando ese stock se vende. Restarlas también
 * contaría dos veces el mismo gasto. Se muestran aparte como `invested`, y
 * `cashFlow` (todo lo que entró − todo lo que salió) da la foto de caja.
 */
export interface Profit {
  productSales: number
  cost: number
  grossProfit: number
  opExpenses: number
  profit: number
  /** Margen de ganancia sobre ventas de productos, 0-100 */
  margin: number
  invested: number
  cashIn: number
  cashOut: number
  cashFlow: number
}

export interface MonthRow extends Profit {
  month: number // 1-12
  orders: number
  units: number
  revenue: number
}

const OPERATING_CATEGORIES = new Set(['operacion', 'marketing', 'otro'])

function emptyProfit(): Profit {
  return { productSales: 0, cost: 0, grossProfit: 0, opExpenses: 0, profit: 0, margin: 0, invested: 0, cashIn: 0, cashOut: 0, cashFlow: 0 }
}

function addOrder(p: Profit, o: ReportOrder) {
  const total = Number(o.total)
  p.cashIn += total
  p.productSales += total - Number(o.shipping_cost ?? 0)
  p.cost += o.items.reduce((s, it) => s + Number(it.unit_cost ?? 0) * it.quantity, 0)
}

function addExpense(p: Profit, e: ReportExpense) {
  const amount = Number(e.amount)
  p.cashOut += amount
  if (e.category === 'inventario') p.invested += amount
  else if (OPERATING_CATEGORIES.has(e.category)) p.opExpenses += amount
  // 'envio': solo afecta la caja (el envío es traspaso, ver arriba).
}

function finish(p: Profit) {
  p.grossProfit = p.productSales - p.cost
  p.profit = p.grossProfit - p.opExpenses
  p.margin = p.productSales > 0 ? (p.profit / p.productSales) * 100 : 0
  p.cashFlow = p.cashIn - p.cashOut
}

export interface SalesReport {
  years: number[]
  year: number
  /** null = año completo */
  month: number | null
  months: MonthRow[]
  totals: { orders: number; units: number; revenue: number; avgTicket: number }
  /** Ganancia del período elegido (mes o año) */
  profit: Profit
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
  month: number | null,
  expenses: ReportExpense[] = []
): SalesReport {
  const sales = allOrders.filter(isRealSale).map((o) => ({ o, ...chileYearMonth(o.created_at) }))
  const gastos = expenses.map((e) => ({ e, ...chileYearMonth(e.created_at) }))

  const years = [...new Set([...sales.map((s) => s.year), ...gastos.map((g) => g.year)])].sort((a, b) => b - a)
  const year = wantedYear && years.includes(wantedYear) ? wantedYear : (years[0] ?? new Date().getFullYear())

  const ofYear = sales.filter((s) => s.year === year)
  const gastosYear = gastos.filter((g) => g.year === year)

  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, orders: 0, units: 0, revenue: 0, ...emptyProfit() }))
  for (const { o, month: m } of ofYear) {
    const row = months[m - 1]
    row.orders += 1
    row.revenue += Number(o.total)
    row.units += o.items.reduce((s, it) => s + it.quantity, 0)
    addOrder(row, o)
  }
  for (const { e, month: m } of gastosYear) addExpense(months[m - 1], e)
  months.forEach(finish)

  const period = month ? ofYear.filter((s) => s.month === month) : ofYear
  const profit = emptyProfit()
  for (const { o } of period) addOrder(profit, o)
  for (const { e } of month ? gastosYear.filter((g) => g.month === month) : gastosYear) addExpense(profit, e)
  finish(profit)

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
    profit,
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
