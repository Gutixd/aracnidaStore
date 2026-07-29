/**
 * Serializa un objeto para insertarlo en un <script type="application/ld+json">.
 * JSON.stringify por sí solo NO escapa "<", así que un valor con contenido
 * como texto de una reseña con "</script><script>...` rompería el tag y
 * ejecutaría JavaScript arbitrario para cualquier visitante de la página.
 * Esto importa especialmente acá porque parte de este JSON-LD (reseñas)
 * viene de texto escrito por clientes.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
