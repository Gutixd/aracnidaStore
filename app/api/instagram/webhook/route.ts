import { NextRequest, NextResponse, after } from 'next/server'
import { isValidSignature, type IgWebhookBody } from '@/lib/instagram-dm'
import { handleInstagramWebhook } from '@/lib/ig-assistant'

// La IA espera unos segundos por si el cliente sigue escribiendo y luego
// llama a Claude: se le da margen a la función.
export const maxDuration = 60

/** Verificación que hace Meta al registrar el webhook. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  if (token && p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === token) {
    return new NextResponse(p.get('hub.challenge') ?? '', { status: 200 })
  }
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

/**
 * Mensajes nuevos. Se responde 200 de inmediato (Meta reintenta si tarda) y
 * el trabajo sigue en segundo plano con after().
 */
export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!isValidSignature(raw, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }
  let body: IgWebhookBody
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (body.object === 'instagram') after(() => handleInstagramWebhook(body))
  return NextResponse.json({ ok: true })
}
