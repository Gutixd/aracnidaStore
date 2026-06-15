import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

/**
 * Cliente de Mercado Pago. Se crea bajo demanda para no fallar en build
 * si la variable de entorno aún no está configurada.
 */
function getClient() {
  if (!ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no está configurado')
  }
  return new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
}

export function getPreferenceClient() {
  return new Preference(getClient())
}

export function getPaymentClient() {
  return new Payment(getClient())
}

export const isMercadoPagoEnabled = () => Boolean(ACCESS_TOKEN)
