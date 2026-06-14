import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import { AdminExpenseForm } from '@/components/admin/AdminExpenseForm'
import { AdminDeleteExpense } from '@/components/admin/AdminDeleteExpense'
import { DollarSign } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  inventario: 'Inventario',
  envio: 'Envío',
  operacion: 'Operación',
  marketing: 'Marketing',
  otro: 'Otro',
}

async function getData() {
  const supabase = await createAdminClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: orders } = await supabase
    .from('orders')
    .select('total, subtotal, shipping_cost')
    .neq('status', 'cancelado')

  const totalExpenses = expenses?.reduce((sum: number, e: { amount: unknown }) => sum + Number(e.amount), 0) ?? 0
  const totalSales = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const netProfit = totalSales - totalExpenses

  return { expenses: expenses ?? [], totalExpenses, totalSales, netProfit }
}

export default async function AdminExpensesPage() {
  const { expenses, totalExpenses, totalSales, netProfit } = await getData()

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Gastos y finanzas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>Control de costos y utilidad neta</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>Total ventas</p>
          <p className="text-2xl font-black tabular-nums" style={{ color: '#15803d' }}>{formatPrice(totalSales)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>Total gastos</p>
          <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(totalExpenses)}</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--gray-400)' }}>Utilidad neta</p>
          <p className="text-2xl font-black tabular-nums" style={{ color: netProfit >= 0 ? '#15803d' : 'var(--red)' }}>{formatPrice(netProfit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div>
          <div className="card p-6 mb-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Registrar gasto</h2>
            <AdminExpenseForm />
          </div>
          <div className="card p-6">
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Por categoría</h2>
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--gray-600)' }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>{formatPrice(Number(amount))}</span>
                </div>
              ))}
              {Object.keys(byCategory).length === 0 && <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Sin gastos registrados</p>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 card overflow-hidden">
          <div className="p-5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--gray-100)' }}>
            <DollarSign size={16} style={{ color: 'var(--gray-400)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Historial de gastos</h2>
          </div>
          <div>
            {expenses.length === 0 && <div className="p-12 text-center text-sm" style={{ color: 'var(--gray-400)' }}>Sin gastos registrados</div>}
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center gap-4" style={{ borderTop: '1px solid var(--gray-50)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                    {expense.note && <span className="text-xs truncate" style={{ color: 'var(--gray-400)' }}>{expense.note}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--red)' }}>{formatPrice(expense.amount)}</p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{formatDate(expense.created_at)}</p>
                </div>
                <AdminDeleteExpense id={expense.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
