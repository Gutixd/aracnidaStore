// Lógica de envío Blue Express desde Santiago.
// Esta es la fuente de verdad: se usa tanto en el checkout (para mostrar al
// cliente) como en el servidor (para calcular el costo real del pedido).
// NUNCA se debe confiar en un costo de envío enviado desde el navegador.

export const FREE_SHIPPING_THRESHOLD = 50000

export const SHIPPING_ZONES: Record<
  string,
  { cost: number; zone: number; label: string; freeShipping: boolean }
> = {
  'Región Metropolitana de Santiago':                    { zone: 1, cost: 3990, label: 'Zona 1 · Metropolitana',   freeShipping: true },
  'Región de Valparaíso':                                { zone: 2, cost: 5490, label: 'Zona 2 · Centro',          freeShipping: true },
  "Región del Libertador General Bernardo O'Higgins":    { zone: 2, cost: 5490, label: 'Zona 2 · Centro',          freeShipping: true },
  'Región del Maule':                                    { zone: 2, cost: 5490, label: 'Zona 2 · Centro',          freeShipping: true },
  'Región del Ñuble':                                    { zone: 2, cost: 5490, label: 'Zona 2 · Centro',          freeShipping: true },
  'Región de Coquimbo':                                  { zone: 3, cost: 6490, label: 'Zona 3 · Norte/Sur medio', freeShipping: false },
  'Región del Biobío':                                   { zone: 3, cost: 6490, label: 'Zona 3 · Norte/Sur medio', freeShipping: false },
  'Región de La Araucanía':                              { zone: 3, cost: 6490, label: 'Zona 3 · Norte/Sur medio', freeShipping: false },
  'Región de Arica y Parinacota':                        { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Tarapacá':                                  { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Antofagasta':                               { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Atacama':                                   { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Los Ríos':                                  { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Los Lagos':                                 { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Aysén del General Carlos Ibáñez del Campo': { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
  'Región de Magallanes y de la Antártica Chilena':      { zone: 4, cost: 7990, label: 'Zona 4 · Extremos',        freeShipping: false },
}

export const REGIONES_CHILE = Object.keys(SHIPPING_ZONES)

const DEFAULT_COST = 3990

export function getShippingInfo(region: string | undefined, subtotal: number) {
  if (!region) return { cost: DEFAULT_COST, label: '', freeShipping: false, zone: 0 }
  const zone = SHIPPING_ZONES[region]
  if (!zone) return { cost: DEFAULT_COST, label: '', freeShipping: false, zone: 0 }
  const free = zone.freeShipping && subtotal >= FREE_SHIPPING_THRESHOLD
  return { cost: free ? 0 : zone.cost, label: zone.label, freeShipping: zone.freeShipping, zone: zone.zone }
}

/**
 * Calcula el costo de envío autoritativo en el servidor.
 * - Retiro en tienda => 0.
 * - Delivery => según zona y umbral de envío gratis.
 */
export function calcShippingCost(
  deliveryMethod: 'delivery' | 'retiro',
  region: string | undefined,
  subtotal: number
): number {
  if (deliveryMethod === 'retiro') return 0
  return getShippingInfo(region, subtotal).cost
}
