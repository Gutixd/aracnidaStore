
// Content Security Policy. Se permite 'unsafe-inline'/'unsafe-eval' porque
// la app usa estilos en línea y Next.js los necesita en runtime; aun así se
// bloquea el embebido en iframes (clickjacking), plugins y bases externas.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://*.mercadopago.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com",
  "frame-src 'self' https://*.mercadopago.com",
  "form-action 'self' https://*.mercadopago.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

// Todo dominio que NO sea el canónico redirige 301 hacia el canónico. Sin esto,
// Google ve el mismo sitio en varias URLs (contenido duplicado) y reparte las
// señales de posicionamiento. El canónico sale de NEXT_PUBLIC_APP_URL: para
// pasar de aracnidastore.com a aracnidastore.cl solo se cambia esa variable
// (y se vuelve a publicar); el dominio viejo queda redirigiendo al nuevo, así
// no se rompen los links de Instagram, Google ni los correos ya enviados.
const CANONICAL_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com').replace(/\/$/, '')
const CANONICAL_HOST = CANONICAL_URL.replace(/^https?:\/\//, '')
const KNOWN_HOSTS = [
  'aracnidastore.com',
  'www.aracnidastore.com',
  'aracnidastore.cl',
  'www.aracnidastore.cl',
  'aracnida-store.vercel.app',
  'aracnida-store-gutixds-projects.vercel.app',
  'aracnida-store-git-master-gutixds-projects.vercel.app',
]
const DUPLICATE_HOSTS = KNOWN_HOSTS.filter((h) => h !== CANONICAL_HOST)

const nextConfig = {
  poweredByHeader: false,
  // Por defecto Next.js limita el body de una Server Action a 1 MB. La
  // publicación de Instagram sube la imagen como base64 (pesa ~33% más que
  // el archivo original) a través de una Server Action, y esas imágenes
  // suelen pesar varios MB — con el límite por defecto la subida fallaba
  // en silencio y el botón se quedaba pegado en "Programando...".
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Portada y fichas: renderizadas en el servidor, pero la CDN las guarda
      // 2 min (y sirve la copia vieja hasta 1 h mientras se actualiza en
      // segundo plano). Así no se paga ISR y casi todas las visitas ni
      // llegan a la función. Un cambio de stock se ve en ≤2 min.
      // Next.js pone su propio Cache-Control (private, no-store) en páginas
      // dinámicas y pisa el nuestro; Vercel-CDN-Cache-Control es la cabecera
      // que lee solo la CDN de Vercel, así que Next no la toca.
      {
        source: '/',
        headers: [{ key: 'Vercel-CDN-Cache-Control', value: 's-maxage=120, stale-while-revalidate=3600' }],
      },
      {
        source: '/products/:slug',
        headers: [{ key: 'Vercel-CDN-Cache-Control', value: 's-maxage=120, stale-while-revalidate=3600' }],
      },
      // Los archivos de /public salían con `max-age=0, must-revalidate`: el
      // navegador volvía a preguntar por el video en cada visita. Se cachean
      // 7 días; si se reemplaza un video, conviene cambiarle el nombre.
      {
        source: '/:file(video-.*\\.mp4|video-.*-poster\\.jpg)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ]
  },
  async redirects() {
    return DUPLICATE_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host', value: host }],
      destination: `${CANONICAL_URL}/:path*`,
      permanent: true,
    }))
  },
}

export default nextConfig
