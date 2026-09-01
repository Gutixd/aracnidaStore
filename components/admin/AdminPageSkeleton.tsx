/**
 * Esqueleto genérico para los `loading.tsx` de /admin. Sin esto, Next.js
 * espera a que la página del servidor termine de traer sus datos antes de
 * pintar cualquier cosa — el clic en el menú se siente "colgado" 2-3
 * segundos. Con un `loading.tsx` por ruta, la navegación cambia al instante
 * y este esqueleto se muestra mientras los datos reales llegan por detrás.
 */
export function AdminPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-40 rounded-lg mb-2" style={{ background: 'var(--gray-100)' }} />
        <div className="h-4 w-56 rounded-lg" style={{ background: 'var(--gray-50)' }} />
      </div>

      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid var(--gray-100)' }}>
          <div className="h-3 w-full rounded" style={{ background: 'var(--gray-50)' }} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4" style={{ borderTop: '1px solid var(--gray-50)' }}>
            <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: 'var(--gray-100)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 rounded" style={{ background: 'var(--gray-100)' }} />
              <div className="h-3 w-1/4 rounded" style={{ background: 'var(--gray-50)' }} />
            </div>
            <div className="h-3.5 w-16 rounded" style={{ background: 'var(--gray-50)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
