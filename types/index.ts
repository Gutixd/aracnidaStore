export type ProductCategory = 'trajes' | 'mascaras' | 'accesorios'

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Única'

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'en_reparto'
  | 'entregado'
  | 'cancelado'

export type DeliveryMethod = 'delivery' | 'retiro'

export type InventoryMovementType =
  | 'increase'
  | 'decrease'
  | 'adjust'
  | 'sale'
  | 'return'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  cost_price: number
  /**
   * Precio anunciado al que subirá el producto. NO es un precio anterior:
   * nunca se vendió a ese valor, así que no debe mostrarse tachado — sería
   * un precio de referencia falso (Ley 19.496). Se muestra como "sube a $X".
   */
  future_price?: number | null
  stock: number
  sku: string
  category_id: string
  size: ProductSize | string
  color: string
  image_url: string
  active: boolean
  featured: boolean
  created_at: string
  updated_at: string
  category?: Category
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  stock: number
  price: number
  cost_price: number
  sku: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string
  order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  delivery_method: DeliveryMethod
  delivery_address: string
  delivery_region?: string | null
  delivery_commune: string
  delivery_reference: string
  status: OrderStatus
  payment_status: 'pendiente' | 'pagado' | 'rechazado' | 'reembolsado'
  payment_provider?: string | null
  payment_id?: string | null
  payment_method?: string | null
  pickup_slot?: string | null
  pickup_time?: string | null
  /** Fecha exacta del retiro (YYYY-MM-DD) */
  pickup_date?: string | null
  mp_preference_id?: string | null
  notes: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string
  size: string
  color: string
  quantity: number
  unit_price: number
  total_price: number
  product?: Product
}

export interface InventoryMovement {
  id: string
  product_id: string
  type: InventoryMovementType
  quantity: number
  reason: string
  previous_stock: number
  new_stock: number
  created_by: string
  created_at: string
  product?: Product
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: 'inventario' | 'envio' | 'operacion' | 'marketing' | 'otro'
  note: string
  created_at: string
}

export interface CartItem {
  product: Product
  variant: ProductVariant
  quantity: number
}

export interface StoreSettings {
  id: string
  store_name: string
  shipping_cost: number
  free_shipping_threshold: number
  whatsapp_number: string
  instagram_url: string
  tiktok_url: string
  contact_email: string
  address: string
  low_stock_threshold: number
}

export interface DashboardStats {
  totalSales: number
  totalOrders: number
  averageTicket: number
  netProfit: number
  totalCost: number
  pendingOrders: number
  lowStockProducts: number
}
