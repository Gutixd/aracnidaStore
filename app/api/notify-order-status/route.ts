import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyOrderStatusChange } from '@/lib/telegram'

const VALID_STATUSES = [
  'pendiente', 'confirmado', 'en_preparacion', 'en_reparto', 'entregado', 'cancelado',
]

export async function POST(request: NextRequest) {
  try {
    // Solo administradores autenticados pueden disparar notificaciones.
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) {
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
