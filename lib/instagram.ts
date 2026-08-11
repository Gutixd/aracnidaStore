/**
 * Publicación en Instagram vía Graph API (Meta).
 *
 * El flujo real de Meta son dos pasos: primero se crea un "contenedor" con
 * la imagen (Meta la descarga desde `image_url`, tiene que ser pública) y
 * el texto, y luego se publica ese contenedor. No hay forma de subir el
 * archivo directo — por eso las imágenes de la cola viven en un bucket
 * público de Supabase Storage.
 *
 * Requiere en el entorno:
 *   INSTAGRAM_ACCESS_TOKEN        — token de larga duración de la cuenta Business
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID — id numérico de la cuenta de Instagram
 */

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const API_VERSION = 'v21.0'

export const isInstagramEnabled = () => Boolean(ACCESS_TOKEN && ACCOUNT_ID)

/** Publica una imagen con su descripción. Devuelve el id del post en Instagram. */
export async function publishToInstagram(imageUrl: string, caption: string): Promise<string> {
  if (!isInstagramEnabled()) {
    throw new Error('Instagram no está configurado (faltan variables de entorno)')
  }

  // 1) Crear el contenedor con la imagen y el texto
  const createRes = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${ACCOUNT_ID}/media`,
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

  // 2) Publicar el contenedor ya creado
  const publishRes = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${ACCOUNT_ID}/media_publish`,
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
