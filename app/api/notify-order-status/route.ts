import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyOrderStatusChange } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json()

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
