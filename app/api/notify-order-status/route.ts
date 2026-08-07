import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { notifyOrderStatusChange } from '@/lib/telegram'

const VALID_STATUSES = [
  'pendiente', 'confirmado', 'en_preparacion', 'en_reparto', 'entregado', 'cancelado',
]

export async function POST(request: NextRequest) {
  try {
    // Solo administradores. Antes bastaba con tener sesión iniciada, y como
    // más abajo se consulta con la service role key (que ignora RLS),
    // cualquier cuenta podía pedir notificaciones sobre pedidos ajenos.
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId, newStatus } = await request.json()
    if (typeof orderId !== 'string' || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (order) {
      await notifyOrderStatusChange(order, newStatus)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify-order-status]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
