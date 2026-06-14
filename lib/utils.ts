import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateSKU(category: string, size: string, color: string): string {
  const cat = category.slice(0, 3).toUpperCase()
  const sz = size.slice(0, 2).toUpperCase()
  const col = color.slice(0, 3).toUpperCase()
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${cat}-${sz}-${col}-${rand}`
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  en_preparacion: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  en_reparto: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  entregado: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelado: 'bg-red-500/10 text-red-400 border-red-500/20',
}
