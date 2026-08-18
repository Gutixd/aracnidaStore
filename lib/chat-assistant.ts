import { createClient } from '@/lib/supabase/server'
import { PICKUP_PLACE, PICKUP_LEAD_HOURS } from '@/lib/pickup'
import { MIN_SHIPPING_COST } from '@/lib/shipping'

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
const MODEL = 'gemini-3.6-flash'
const WHATSAPP = '+56 9 7882 9942'

export const isChatAssistantEnabled = () => Boolean(API_KEY)

async function buildStoreContext(): Promise<string> {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('name, price, stock, description, size, color, category:categories(name)')
    .eq('active', true)
    .order('price')

  const catalogo = (products ?? [])
    .map((p) => {
      const cat = Array.isArray(p.category) ? p.category[0] : p.category
      const stockTxt = p.stock > 0 ? `${p.stock} en stock` : 'AGOTADO'
      return `- ${p.name} (${cat?.name ?? 'producto'}) — $${Number(p.price).toLocaleString('es-CL')} — talla ${p.size} — ${stockTxt}`
    })
    .join('\n')

  return `
CATÁLOGO ACTUAL (única fuente de verdad para precios y stock — si un producto no está en esta lista, no existe o no está disponible):
${catalogo || '(sin productos activos en este momento)'}

TALLAS DE DISFRACES (por altura, en cm):
XS/100: 90-100cm · S/110: 100-110cm · M/120: 110-120cm · L/130: 120-130cm · XL/140: 130-140cm · 160: 150-160cm · 170: 160-170cm · 180: 170-180cm · 190: 180-190cm
Si está entre dos tallas, recomendar la mayor. Las máscaras son talla única elástica.

ENVÍOS Y RETIRO:
- Envío a domicilio por Blue Express a todo Chile, desde $${MIN_SHIPPING_COST.toLocaleString('es-CL')} según la región (se calcula y muestra en el checkout).
- Región Metropolitana: 1 a 3 días hábiles. Resto de Chile: 3 a 7 días hábiles.
- Retiro gratis en ${PICKUP_PLACE}: martes 13:00-16:00 y sábado 11:00-15:00, coordinando con al menos ${PICKUP_LEAD_HOURS} horas de anticipación.

PAGO:
- Envío a domicilio: Mercado Pago (tarjetas de crédito, débito o transferencia dentro de esa plataforma).
- Retiro en persona: efectivo o transferencia bancaria directa al momento del retiro.

CAMBIOS Y DEVOLUCIONES:
- 7 días corridos desde la recepción, producto sin usar, con etiquetas, en su embalaje original, y con el número de orden. El cliente cubre el envío de la devolución.

OTROS DATOS:
- Los precios están en pesos chilenos (CLP) e incluyen IVA.
- Los pedidos con pago en línea que no se completan en 45 minutos se cancelan y el stock se libera.
- Es una tienda de disfraces y máscaras de cosplay inspirados en Spider-Man (Marvel/Disney), no productos oficiales de Marvel.
`.trim()
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
        // thinkingBudget: 0 evita que el modelo gaste tokens "pensando" antes
        // de responder — sin esto, gemini-3.6-flash cortaba respuestas cortas
        // a mitad de frase porque el razonamiento interno consumía el límite.
        generationConfig: { maxOutputTokens: 800, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Error de Gemini: ${JSON.stringify(data.error ?? data)}`)
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
