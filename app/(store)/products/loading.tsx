import { ProductsGridSkeleton } from '@/components/store/ProductsGridSkeleton'

/**
 * Cubre la PRIMERA entrada a /products (desde otra ruta, ej. el home). El
 * cambio de categoría sobre esta misma ruta usa un <Suspense> aparte dentro
 * de page.tsx — ver el comentario ahí para el porqué.
 */
export default function Loading() {
  return <ProductsGridSkeleton />
}
