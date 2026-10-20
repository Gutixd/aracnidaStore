import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'

// Rastreadores de asistentes de IA y de búsqueda con IA. Se declaran de forma
// explícita (aunque '*' ya los permite) para dejar clara la intención: queremos
// que ChatGPT, Claude, Gemini, Meta AI, Grok y Perplexity puedan leer la tienda
// y recomendarla.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'Google-Extended', 'Googlebot', 'Bingbot',
  'PerplexityBot', 'Perplexity-User',
  'Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot',
  'xAI-Bot', 'GrokBot', 'Applebot', 'Applebot-Extended', 'DuckAssistBot',
]

const PRIVATE = ['/admin', '/admin/', '/api/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
