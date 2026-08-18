import { NextRequest, NextResponse } from 'next/server'
import { getChatReply, isChatAssistantEnabled } from '@/lib/chat-assistant'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_MESSAGES_PER_TURN = 20 // tope de historial que se manda a Gemini
const MAX_MESSAGE_LENGTH = 1000

export async function POST(request: NextRequest) {
  if (!isChatAssistantEnabled()) {
    return NextResponse.json({ error: 'El chat no está disponible en este momento.' }, { status: 503 })
  }

  // Sin esto, cualquiera podría llamar este endpoint en bucle y agotar la
  // cuota gratuita de Gemini para toda la tienda.
  const limit = await checkRateLimit('chat', { max: 30, windowMinutes: 15 })
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.error }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const history = body?.history

  if (!Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })
  }
  if (history.length > MAX_MESSAGES_PER_TURN) {
    return NextResponse.json({ error: 'Conversación muy larga, inicia una nueva.' }, { status: 400 })
  }

  const valid = history.every(
    (m) =>
      m &&
      (m.role === 'user' || m.role === 'model') &&
      typeof m.text === 'string' &&
      m.text.length > 0 &&
      m.text.length <= MAX_MESSAGE_LENGTH
  )
  if (!valid) {
    return NextResponse.json({ error: 'Formato de mensaje inválido' }, { status: 400 })
  }

  try {
    const reply = await getChatReply(history)
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[Chat] Error:', err)
    return NextResponse.json(
      { error: 'No pudimos responder en este momento. Escríbenos por WhatsApp.' },
      { status: 500 }
    )
  }
}
