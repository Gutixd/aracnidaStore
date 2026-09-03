/**
 * Se activa al entrar a la ficha de un producto (desde el catálogo o
 * directo). Mismo criterio que products/loading.tsx: reproduce la forma
 * real (galería a la izquierda, info a la derecha) para que no haya un
 * salto brusco entre el esqueleto y el contenido real.
 */
export default function Loading() {
  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-4 w-64 rounded mb-6" style={{ background: 'var(--gray-100)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl" style={{ background: 'var(--gray-100)' }} />

          <div className="space-y-4">
            <div className="h-4 w-24 rounded" style={{ background: 'var(--gray-100)' }} />
            <div className="h-8 w-4/5 rounded-lg" style={{ background: 'var(--gray-100)' }} />
            <div className="h-8 w-32 rounded-lg" style={{ background: 'var(--gray-100)' }} />
            <div className="h-24 w-full rounded-xl mt-2" style={{ background: 'var(--gray-50)' }} />
            <div className="h-12 w-full rounded-xl mt-6" style={{ background: 'var(--gray-100)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
