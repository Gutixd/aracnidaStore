import type { NextConfig } from 'next'

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

// Todo dominio que NO sea el canónico redirige 301 hacia aracnidastore.com.
// Sin esto, Google ve el mismo sitio en 5 URLs distintas (contenido
// duplicado) y reparte las señales de posicionamiento entre todas en vez
// de concentrarlas en el dominio real — el canonical tag por sí solo no
// alcanza si esos otros dominios siguen respondiendo 200 en vez de redirigir.
const DUPLICATE_HOSTS = [
  'www.aracnidastore.com',
  'aracnida-store.vercel.app',
  'aracnida-store-gutixds-projects.vercel.app',
  'aracnida-store-git-master-gutixds-projects.vercel.app',
]

const nextConfig: NextConfig = {
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
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return DUPLICATE_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: 'https://aracnidastore.com/:path*',
      permanent: true,
    }))
  },
}

export default nextConfig
