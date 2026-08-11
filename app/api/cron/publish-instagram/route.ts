import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { publishToInstagram } from '@/lib/instagram'

/**
 * Corre una vez al día (ver vercel.json). Publica todo lo que tenga
 * scheduled_for <= hoy y siga en estado "pendiente". Si Instagram rechaza
 * una, se marca "error" y se sigue con las demás — un fallo no debe frenar
 * el resto de la cola.
 *
 * Vercel agrega solo el header Authorization con CRON_SECRET cuando esa
 * variable existe: así se evita que cualquiera dispare publicaciones
 * llamando a esta URL a mano.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: pendientes } = await supabase
    .from('instagram_posts')
    .select('*')
    .eq('status', 'pendiente')
    .lte('scheduled_for', today)

  const resultados = []

  for (const post of pendientes ?? []) {
    try {
      const mediaId = await publishToInstagram(post.image_url, post.caption)
      await supabase
        .from('instagram_posts')
        .update({ status: 'publicado', ig_media_id: mediaId, posted_at: new Date().toISOString() })
        .eq('id', post.id)
      resultados.push({ id: post.id, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await supabase.from('instagram_posts').update({ status: 'error', error_message: message }).eq('id', post.id)
      resultados.push({ id: post.id, ok: false, error: message })
      console.error('[Instagram Cron] Error publicando', post.id, message)
    }
  }

  return NextResponse.json({ procesados: resultados.length, resultados })
}
