'use server'

import { createClient } from '@/lib/supabase/server'

export interface CartLineCheck {
  variantId: string
  productName: string
  size: string
  /** Precio actual en la base de datos */
  price: number
  /** Stock disponible ahora */
  stock: number
  active: boolean
}

/**
 * Devuelve el estado real (precio y stock) de las variantes que hay en el carrito.
 * El carrito vive en localStorage y puede quedar desactualizado durante días, así
 * que antes de pagar comparamos contra la base de datos y avisamos al cliente.
 */
export async function checkCart(variantIds: string[]): Promise<CartLineCheck[]> {
  if (!variantIds.length) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('product_variants')
    .select('id, size, price, stock, active, product:products(name)')
    .in('id', variantIds.slice(0, 50))

  return (data ?? []).map((v) => {
    const product = v.product as unknown as { name?: string } | null
    return {
      variantId: v.id,
      productName: product?.name ?? 'Producto',
      size: v.size,
      price: Number(v.price),
      stock: v.stock,
      active: v.active,
    }
  })
}
