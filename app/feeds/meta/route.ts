import { createPublicClient } from '@/lib/supabase/server'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com'

const esc = (v: string) => `"${v.replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`

// Catálogo de productos para Meta (Facebook / Instagram Shops y anuncios).
// Se carga en Commerce Manager como fuente de datos programada con esta URL.
export async function GET() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, sku, price, description, image_url, stock, category:categories(name)')
    .eq('active', true)

  const rows = (data ?? []) as unknown as {
    id: string; name: string; slug: string; sku: string | null; price: number
    description: string | null; image_url: string | null; stock: number
    category: { name: string } | { name: string }[] | null
  }[]

  const head = 'id,title,description,availability,condition,price,link,image_link,brand,product_type'
  const lines = rows
    .filter((p) => p.image_url)
    .map((p) => {
      const cat = Array.isArray(p.category) ? p.category[0]?.name : p.category?.name
      const img = p.image_url!.startsWith('http') ? p.image_url! : `${SITE_URL}${p.image_url}`
      return [
        esc(p.sku || p.id),
        esc(p.name),
        esc(p.description || p.name),
        p.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        `${p.price} CLP`,
        `${SITE_URL}/products/${p.slug}`,
        img,
        'AracnidaStore',
        esc(cat ?? 'Otros'),
      ].join(',')
    })

  return new Response([head, ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
