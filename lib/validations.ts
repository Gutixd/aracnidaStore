import { z } from 'zod'

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Nombre requerido'),
  customer_email: z.string().email('Email inválido'),
  customer_phone: z.string().min(8, 'Teléfono inválido'),
  delivery_method: z.enum(['delivery', 'retiro']),
  delivery_address: z.string().optional(),
  delivery_commune: z.string().optional(),
  delivery_reference: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.delivery_method === 'delivery') {
      return !!data.delivery_address && !!data.delivery_commune
    }
    return true
  },
  { message: 'Dirección y comuna son requeridas para delivery', path: ['delivery_address'] }
)

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export const productEditSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción muy corta'),
  price: z.coerce.number().positive('Precio debe ser mayor a 0'),
  cost_price: z.coerce.number().min(0, 'Costo no puede ser negativo'),
  stock: z.coerce.number().int().min(0, 'Stock no puede ser negativo'),
  size: z.string().min(1, 'Talla requerida'),
  color: z.string().min(1, 'Color requerido'),
  category_id: z.string().uuid('Categoría inválida'),
  image_url: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
})

export type ProductEditFormData = z.infer<typeof productEditSchema>

export const expenseSchema = z.object({
  title: z.string().min(2, 'Título requerido'),
  amount: z.coerce.number().positive('Monto debe ser mayor a 0'),
  category: z.enum(['inventario', 'envio', 'operacion', 'marketing', 'otro']),
  note: z.string().optional(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number().int().positive('Cantidad debe ser positiva'),
  reason: z.string().min(3, 'Motivo requerido'),
  type: z.enum(['increase', 'decrease', 'adjust']),
})

export type StockAdjustFormData = z.infer<typeof stockAdjustSchema>

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(10, 'Descripción muy corta'),
  price: z.coerce.number().positive('Precio debe ser mayor a 0'),
  cost_price: z.coerce.number().min(0, 'Costo no puede ser negativo'),
  stock: z.coerce.number().int().min(0, 'Stock no puede ser negativo'),
  size: z.string().min(1, 'Talla requerida'),
  color: z.string().min(1, 'Color requerido'),
  category_id: z.string().uuid('Categoría inválida'),
  image_url: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
})

export type CreateProductFormData = z.infer<typeof createProductSchema>
