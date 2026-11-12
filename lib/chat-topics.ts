/** Temas en que la IA clasifica cada pregunta (chat de la web e Instagram). */
export const CHAT_TOPICS = {
  tallas: 'Tallas y medidas',
  stock: 'Stock y disponibilidad',
  precio: 'Precios y descuentos',
  envio: 'Envíos y plazos',
  retiro: 'Retiro en persona',
  pago: 'Formas de pago',
  preventa: 'Preventas y reservas',
  pedido: 'Estado de un pedido',
  cambios: 'Cambios y devoluciones',
  producto: 'Detalles de un producto',
  otro: 'Otro',
} as const

export type ChatTopic = keyof typeof CHAT_TOPICS

export const TOPIC_KEYS = Object.keys(CHAT_TOPICS) as ChatTopic[]

export const topicLabel = (t: string) => CHAT_TOPICS[t as ChatTopic] ?? 'Otro'
