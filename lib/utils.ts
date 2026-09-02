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
  // Solo aparecen en reservas anticipadas
  producto_recibido: 'Producto recibido',
  lista_entrega: 'Lista para entrega',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmado: 'bg-blue-50 text-blue-700 border-blue-200',
  en_preparacion: 'bg-purple-50 text-purple-700 border-purple-200',
  en_reparto: 'bg-orange-50 text-orange-700 border-orange-200',
  entregado: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
  producto_recibido: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  lista_entrega: 'bg-teal-50 text-teal-700 border-teal-200',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pago pendiente',
  pagado: 'Pagado',
  rechazado: 'Pago rechazado',
  reembolsado: 'Reembolsado',
  // Ya no se genera (las reservas ahora se pagan 100% al reservar), pero se
  // deja mapeado por si queda alguna fila antigua con este estado.
  abonado: 'Abono pagado',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  pagado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
  reembolsado: 'bg-gray-100 text-gray-600 border-gray-200',
  abonado: 'bg-sky-50 text-sky-700 border-sky-200',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  mercadopago: 'Mercado Pago',
}

