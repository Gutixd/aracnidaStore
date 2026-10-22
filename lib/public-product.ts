import type { Product, ProductVariant } from '@/types'

/**
 * Columnas que la llave pública de Supabase puede leer. El costo de compra
 * (cost_price) NO tiene permiso de lectura para visitantes (ver migración
 * hide_cost_price_from_anon): por eso la tienda nunca debe pedir '*' en
 * products ni en product_variants, o la consulta falla con "permission denied".
 */
export const PUBLIC_PRODUCT_COLUMNS =
  'id, name, slug, description, price, stock, sku, category_id, size, color, image_url, active, featured, created_at, updated_at, future_price'
export const PUBLIC_VARIANT_COLUMNS =
  'id, product_id, size, stock, price, sku, active, created_at, updated_at'

/**
 * Lo único que la tienda necesita del producto en el navegador (tarjetas,
 * selector de tallas, carrito, reserva).
 *
 * Antes se mandaba la fila completa de la base: el costo de compra
 * (cost_price), SKU, fechas e ids internos quedaban visibles para cualquiera
 * que inspeccionara la página, y además engordaban cada página cacheada
 * (más escrituras ISR en Vercel). El servidor recalcula precio y stock al
 * cobrar, así que nada de lo que se quita aquí hace falta en el cliente.
 */
export function toPublicVariant(v: ProductVariant): ProductVariant {
  return {
    id: v.id,
    size: v.size,
    price: v.price,
    stock: v.stock,
    active: v.active,
  } as ProductVariant
}

export function toPublicProduct(p: Product): Product {
  const category = p.category
    ? ({ name: p.category.name, slug: p.category.slug } as Product['category'])
    : undefined
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    future_price: p.future_price ?? null,
    image_url: p.image_url,
    color: p.color,
    stock: p.stock,
    category,
    variants: p.variants?.map(toPublicVariant),
  } as Product
}
