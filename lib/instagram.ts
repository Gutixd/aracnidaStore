/**
 * Publicación en Instagram vía Instagram API con inicio de sesión de
 * Instagram (no Facebook Login) — por eso las llamadas van contra
 * `graph.instagram.com`, no `graph.facebook.com`. Usar el dominio de
 * Facebook con este tipo de token devuelve "Cannot parse access token".
 *
 * El flujo real son dos pasos: primero se crea un "contenedor" con la
 * imagen (Meta la descarga desde `image_url`, tiene que ser pública) y el
 * texto, y luego se publica ese contenedor. No hay forma de subir el
 * archivo directo — por eso las imágenes de la cola viven en un bucket
 * público de Supabase Storage.
 *
 * Requiere en el entorno:
 *   INSTAGRAM_ACCESS_TOKEN        — token de la cuenta Business (empieza con "IGAA")
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID — id de la cuenta bajo este mismo token
 *                                   (obtenido con GET /me?access_token=...,
 *                                   no el id que muestra el panel de Meta —
 *                                   ese es de otro namespace y no sirve aquí)
 */

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const API_VERSION = 'v21.0'
const BASE_URL = 'https://graph.instagram.com'

export const isInstagramEnabled = () => Boolean(ACCESS_TOKEN && ACCOUNT_ID)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Espera a que el contenedor termine de procesar la imagen antes de publicarlo. */
async function waitUntilMediaReady(mediaId: string): Promise<void> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const res = await fetch(
      `${BASE_URL}/${API_VERSION}/${mediaId}?fields=status_code&access_token=${ACCESS_TOKEN}`
    )
    const data = await res.json()

    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') {
      throw new Error(`El contenedor falló al procesar la imagen: ${JSON.stringify(data)}`)
    }
    // IN_PROGRESS o PUBLISHED (raro en este punto): seguir esperando/reintentar publicar igual.
    await sleep(2000)
  }
  // Se agotó la espera; se intenta publicar de todos modos — si de verdad no
  // está lista, media_publish devolverá el mismo error 9007 con un mensaje claro.
}

/** Publica una imagen con su descripción. Devuelve el id del post en Instagram. */
export async function publishToInstagram(imageUrl: string, caption: string): Promise<string> {
  if (!isInstagramEnabled()) {
    throw new Error('Instagram no está configurado (faltan variables de entorno)')
  }

  // 1) Crear el contenedor con la imagen y el texto
  const createRes = await fetch(
    `${BASE_URL}/${API_VERSION}/${ACCOUNT_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: ACCESS_TOKEN,
      }),
    }
  )
  const created = await createRes.json()
  if (!createRes.ok || !created.id) {
    throw new Error(`Error creando el contenedor: ${JSON.stringify(created.error ?? created)}`)
  }

  // Instagram procesa la imagen de forma asíncrona: publicar de inmediato
  // suele fallar con "Media ID is not available" (código 9007) porque el
  // contenedor todavía no queda en estado FINISHED. Se espera hasta 30s,
  // consultando cada 2s, antes de intentar publicar.
  await waitUntilMediaReady(created.id)

  // 2) Publicar el contenedor ya creado
  const publishRes = await fetch(
    `${BASE_URL}/${API_VERSION}/${ACCOUNT_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: created.id,
        access_token: ACCESS_TOKEN,
      }),
    }
  )
  const published = await publishRes.json()
  if (!publishRes.ok || !published.id) {
    throw new Error(`Error publicando: ${JSON.stringify(published.error ?? published)}`)
  }

  return published.id as string
}
