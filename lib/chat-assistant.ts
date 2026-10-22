import { createClient } from '@/lib/supabase/server'
import { buildStoreKnowledge } from '@/lib/store-knowledge'

/**
 * Asistente de chat del sitio, con Gemini (nivel gratis de Google AI Studio).
 * Se usa aparte de Claude (que ya se usa para el copy de Instagram) porque
 * el pedido explícito fue "el de Gemini, que es gratis".
 *
 * Todo lo que el asistente puede decir sobre precios, envíos, retiro y
 * políticas viene de datos reales armados en cada llamada — nunca de lo que
 * "recuerde" el modelo. Si no sabe algo, tiene instrucción de derivar a
 * WhatsApp en vez de inventar.
 *
 * Requiere GEMINI_API_KEY (console.cloud.google.com → Google AI Studio →
 * Get API key). El nivel gratis de gemini-2.0-flash alcanza de sobra para
 * el volumen de una tienda chica.
 */

const API_KEY = process.env.GEMINI_API_KEY
// El nivel gratis de esta cuenta solo da acceso a gemini-3.6-flash, con
// tope de 20 peticiones AL DÍA (no por minuto). gemini-2.5-flash y
// gemini-2.0-flash ya no están disponibles para cuentas nuevas. Al agotarse
// el tope, getChatReply lanza error y el chat se degrada avisando WhatsApp
// (decisión consciente: mantener el nivel gratis en vez de activar
// facturación, aunque eso implique que el chat deje de responder si se
// agotan los 20 mensajes en un mismo día).
const MODEL = 'gemini-3.6-flash'
const WHATSAPP = '+56 9 7882 9942'

export const isChatAssistantEnabled = () => Boolean(API_KEY)

async function buildStoreContext(): Promise<string> {
  // Misma fuente que el asistente de Instagram: catálogo con stock por talla,
  // trajes en camino y políticas reales de la tienda.
  return buildStoreKnowledge(await createClient())
}

const SYSTEM_INSTRUCTIONS = `Eres el asistente de chat de AracnidaStore, tienda chilena de disfraces y máscaras de Spider-Man (aracnidastore.com).

Reglas que no puedes romper:
1. Solo puedes hablar de precios, stock, tallas, envíos, retiro, pagos y cambios usando EXACTAMENTE los datos que se te dan en el contexto de esta conversación. Nunca inventes un precio, un plazo, o que algo está disponible si no aparece ahí.
2. Si te preguntan algo que no está en el contexto (ej. sobre un pedido específico, un reclamo, algo muy particular), responde con honestidad que no tienes esa información y deriva a WhatsApp: ${WHATSAPP}.
3. Sé breve, cercano y en español de Chile. Nada de párrafos largos — este es un chat, no un correo.
4. No prometas nada que no esté en las políticas (ej. no prometas descuentos, no inventes plazos de despacho).
5. Si preguntan por el estado de un pedido ya hecho, dirige a la página "Rastrea tu pedido" (aracnidastore.com/rastrear-pedido) o a WhatsApp — no tienes acceso a pedidos individuales.`

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

/** Genera la respuesta del asistente para el siguiente turno de la conversación. */
export async function getChatReply(history: ChatMessage[]): Promise<string> {
  if (!isChatAssistantEnabled()) {
    throw new Error('El chat no está configurado (falta GEMINI_API_KEY)')
  }

  const context = await buildStoreContext()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${SYSTEM_INSTRUCTIONS}\n\n${context}` }],
        },
        contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Error de Gemini: ${JSON.stringify(data.error ?? data)}`)
  }

  const finishReason = data.candidates?.[0]?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    console.error('[Chat] Respuesta cortada por MAX_TOKENS', JSON.stringify(data.usageMetadata))
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('')
  if (!text) {
    // Bloqueo por seguridad de Gemini u otra respuesta vacía: se degrada con
    // gracia en vez de romper el chat.
    return `No pude procesar eso. Escríbenos directo por WhatsApp: ${WHATSAPP}`
  }
  return text.trim()
}
