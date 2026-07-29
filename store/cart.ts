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
  /** Ajusta el carrito al precio/stock real de la base de datos. */
  syncWithServer: (fresh: SyncedVariant[]) => CartSyncResult
}

export interface SyncedVariant {
  variantId: string
  price: number
  stock: number
  active: boolean
}

export interface CartSyncResult {
  priceChanges: { name: string; size: string; before: number; after: number }[]
  reduced: { name: string; size: string; to: number }[]
  removed: { name: string; size: string }[]
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

      syncWithServer: (fresh) => {
        const byId = new Map(fresh.map((f) => [f.variantId, f]))
        const result: CartSyncResult = { priceChanges: [], reduced: [], removed: [] }
        const nextItems: CartItem[] = []

        for (const item of get().items) {
          const current = byId.get(item.variant.id)
          const label = { name: item.product.name, size: item.variant.size }

          // Ya no existe o fue desactivada
          if (!current || !current.active || current.stock === 0) {
            result.removed.push(label)
            continue
          }

          if (current.price !== item.variant.price) {
            result.priceChanges.push({
              ...label,
              before: item.variant.price,
              after: current.price,
            })
          }

          const quantity = Math.min(item.quantity, current.stock)
          if (quantity < item.quantity) {
            result.reduced.push({ ...label, to: quantity })
          }

          nextItems.push({
            ...item,
            quantity,
            variant: { ...item.variant, price: current.price, stock: current.stock },
          })
        }

        set({ items: nextItems })
        return result
      },
    }),
    { name: 'aracnida-cart-v2' }
  )
)
