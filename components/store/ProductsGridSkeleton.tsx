/**
 * Esqueleto del catálogo, compartido entre app/(store)/products/loading.tsx
 * (primera entrada a /products) y el <Suspense> interno de page.tsx (cambio
 * de categoría/filtro sobre la misma ruta). Mismo componente en los dos
 * casos para que la transición se sienta igual sin importar desde dónde
 * se entra.
 */
export function ProductsGridSkeleton() {
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }} className="pt-28 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-5 w-24 rounded-full" style={{ background: 'rgba(255,255,255,.1)' }} />
          <div className="h-9 w-72 rounded-lg mt-3" style={{ background: 'rgba(255,255,255,.15)' }} />
          <div className="h-4 w-48 rounded mt-3" style={{ background: 'rgba(255,255,255,.08)' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 shrink-0 animate-pulse">
            <div className="h-40 rounded-xl" style={{ background: 'var(--gray-100)' }} />
          </aside>

          <div className="flex-1 grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#fff' }}>
                <div className="aspect-square" style={{ background: 'var(--gray-100)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 w-4/5 rounded" style={{ background: 'var(--gray-100)' }} />
                  <div className="h-3.5 w-1/3 rounded" style={{ background: 'var(--gray-50)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
