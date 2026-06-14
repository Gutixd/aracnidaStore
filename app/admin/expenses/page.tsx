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
        <h1 className="text-2xl font-bold text-white">Gastos y finanzas</h1>
        <p className="text-white/40 text-sm mt-1">Control de costos y utilidad neta</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <p className="text-xs text-white/40 mb-2">Total ventas</p>
          <p className="text-2xl font-black text-green-400">{formatPrice(totalSales)}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <p className="text-xs text-white/40 mb-2">Total gastos</p>
          <p className="text-2xl font-black text-red-400">{formatPrice(totalExpenses)}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 border-l-2 border-l-blue-600/40">
          <p className="text-xs text-white/40 mb-2">Utilidad neta</p>
          <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPrice(netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Add expense form */}
        <div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">Registrar gasto</h2>
            <AdminExpenseForm />
          </div>

          {/* By category */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Por categoría</h2>
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-white/50">{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="font-semibold text-white">{formatPrice(Number(amount))}</span>
                </div>
              ))}
              {Object.keys(byCategory).length === 0 && (
                <p className="text-white/30 text-xs">Sin gastos registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Expenses list */}
        <div className="xl:col-span-2 bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <DollarSign size={16} className="text-white/40" />
            <h2 className="text-sm font-semibold text-white">Historial de gastos</h2>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {expenses.length === 0 && (
              <div className="p-12 text-center text-white/30 text-sm">Sin gastos registrados</div>
            )}
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                    {expense.note && (
                      <span className="text-xs text-white/30 truncate">{expense.note}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-red-400">{formatPrice(expense.amount)}</p>
                  <p className="text-xs text-white/30">{formatDate(expense.created_at)}</p>
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
