/**
 * Cubre el home. En la práctica se ve poco (el home rara vez cambia de
 * datos entre navegaciones), pero cierra el mismo patrón en toda la
 * tienda: ninguna sección principal debe quedar sin loading.tsx.
 */
export default function Loading() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }} className="pt-28">
      <div className="animate-pulse" style={{ height: '90vh', background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 100%)' }} />
    </div>
  )
}
