/**
 * Dirección pública de la tienda. UN solo lugar: para cambiar de dominio basta
 * con cambiar la variable NEXT_PUBLIC_APP_URL (y volver a publicar), sin tocar
 * el código. Si la variable no existe, se usa el dominio actual.
 */
export const DEFAULT_SITE_URL = 'https://aracnidastore.com'

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL).replace(/\/$/, '')

/** Solo el host, sin https:// (p. ej. "aracnidastore.cl"), para los textos. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
