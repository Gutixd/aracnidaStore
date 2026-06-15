import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnida-store.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/guia-de-tallas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/sobre-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/products?category=disfraces`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=mascaras`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=accesorios`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=peluches`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  return [...staticUrls, ...productUrls]
}
