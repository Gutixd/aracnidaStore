/**
 * Genera el copy de Instagram con Claude (visión): mira la imagen y escribe
 * la descripción en el mismo estilo que ya usamos a mano — gancho con la
 * palabra clave completa, ubicación (Maipú/Santiago/Chile) para SEO/GEO
 * local, y hashtags mezclando genéricos y locales.
 *
 * El catálogo real se pasa como contexto para que el precio que mencione
 * (si menciona uno) sea siempre uno que existe — nunca lo inventa.
 *
 * Requiere ANTHROPIC_API_KEY en el entorno.
 */

const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-5'

export const isClaudeEnabled = () => Boolean(API_KEY)

const SYSTEM_PROMPT = `Eres quien escribe las publicaciones de Instagram de AracnidaStore, una tienda chilena de disfraces y máscaras de Spider-Man (envíos a todo Chile, retiro gratis en Metro Plaza de Maipú, Santiago).

Mira la imagen y escribe UN copy para Instagram, en español de Chile, siguiendo exactamente este estilo:

1. Primera línea: un gancho corto con la palabra clave completa (ej. "Disfraces de Spider-Man en Chile", "Máscaras de Spider-Man con luces y sonido"), con un emoji de araña 🕷️ si calza.
2. Un párrafo breve (2-3 líneas) describiendo lo que se ve en la imagen, con energía pero sin exagerar.
3. Si en el "Catálogo disponible" de abajo hay un producto que claramente coincide con lo que se ve en la imagen, menciona su precio exacto tal como aparece ahí. Si no estás seguro de cuál es, NO inventes un precio — omítelo o usa una frase genérica como "revisa el precio en aracnidastore.com".
4. Menciona "aracnidastore.com" y, cuando aporte, "retiro en Maipú" o "envíos a todo Chile".
5. Una pregunta o llamada a la acción para generar comentarios.
6. Una línea en blanco y luego 6 a 9 hashtags, mezclando genéricos (#SpidermanChile #DisfracesChile) con locales (#Maipú #Santiago) y específicos del producto si aplica.

Nunca inventes cifras de clientes, reseñas, o stock. Nunca prometas algo que no esté en el catálogo. Responde SOLO con el texto del copy, sin comillas ni explicaciones adicionales.`

/** Le pide a Claude que redacte el copy mirando la imagen. */
export async function generateInstagramCaption(
  imageBase64: string,
  mediaType: string,
  catalogText: string
): Promise<string> {
  if (!isClaudeEnabled()) {
    throw new Error('Falta configurar ANTHROPIC_API_KEY')
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Catálogo disponible (nombre — precio — stock):\n${catalogText}\n\nEscribe el copy para esta imagen.`,
            },
          ],
        },
      ],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Error generando el copy: ${JSON.stringify(data.error ?? data)}`)
  }

  const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text
  if (!text) throw new Error('Claude no devolvió texto')
  return text.trim()
}
