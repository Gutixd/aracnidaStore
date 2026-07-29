import { headers } from 'next/headers'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

// No es un secreto criptográfico: solo evita guardar la IP en texto plano.
const PEPPER = 'aracnidastore-rate-limit'

async function getClientIpHash(): Promise<string> {
  const h = await headers()
  // Vercel entrega la IP real del visitante en este header.
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  return crypto.createHash('sha256').update(PEPPER + ip).digest('hex')
}

interface RateLimitOptions {
  /** Máximo de intentos permitidos dentro de la ventana de tiempo */
  max: number
  /** Duración de la ventana, en minutos */
  windowMinutes: number
}

/**
 * Limita cuántas veces se puede ejecutar una acción pública desde la misma IP
 * en un período de tiempo. Protege contra spam de reseñas, fuerza bruta en
 * la búsqueda de pedidos, y creación masiva de pedidos que bloquearía stock
 * real reservándolo sin pagar.
 *
 * Se guarda en la base de datos (no en memoria) para que el límite funcione
 * igual sin importar en qué instancia del servidor caiga la petición.
 */
export async function checkRateLimit(
  bucket: string,
  { max, windowMinutes }: RateLimitOptions
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const ipHash = await getClientIpHash()
  const supabase = await createAdminClient()
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString()

  // Limpieza oportunista de registros viejos para no acumular basura.
  const cleanupCutoff = new Date(Date.now() - windowMinutes * 3 * 60_000).toISOString()
  await supabase.from('rate_limit_hits').delete().eq('bucket', bucket).lt('created_at', cleanupCutoff)

  const { count } = await supabase
    .from('rate_limit_hits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', bucket)
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if ((count ?? 0) >= max) {
    return { allowed: false, error: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.' }
  }

  await supabase.from('rate_limit_hits').insert({ bucket, ip_hash: ipHash })
  return { allowed: true }
}
