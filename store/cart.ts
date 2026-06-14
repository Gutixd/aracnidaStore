'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductVariant } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant, quantity = 1) => {
        const { items } = get()
        const existing = items.find((i) => i.variant.id === variant.id)

        if (existing) {
          set({
            items: items.map((i) =>
              i.variant.id === variant.id
                ? { ...i, quantity: Math.min(i.quantity + quantity, variant.stock) }
                : i
            ),
          })
        } else {
          set({ items: [...items, { product, variant, quantity }] })
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variant.id !== variantId) })
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.variant.id === variantId
              ? { ...i, quantity: Math.min(quantity, i.variant.stock) }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0),
    }),
    { name: 'aracnida-cart-v2' }
  )
)
