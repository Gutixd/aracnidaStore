// Tarea programada de Hostinger (Cron Jobs → Node.js → scripts/cron.js).
// Publica en Instagram lo que esté programado para hoy llamando al endpoint de
// la tienda. Hostinger ejecuta este archivo con las variables de entorno de la
// app (--env-file), así que CRON_SECRET se lee de acá y no se escribe en
// ningún comando ni en el panel de cron.
//
// Reemplaza al cron de Vercel (vercel.json), que ya no corre en Hostinger.

const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.com').replace(/\/$/, '')
const secret = process.env.CRON_SECRET

if (!secret) {
  console.error('[cron] Falta CRON_SECRET en las variables de entorno de la app')
  process.exitCode = 1
}

fetch(`${base}/api/cron/publish-instagram`, {
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(110_000),
})
  .then(async (res) => {
    const body = await res.text()
    console.log(`[cron] ${new Date().toISOString()} → ${res.status} ${body.slice(0, 500)}`)
    process.exitCode = res.ok ? 0 : 1
  })
  .catch((err) => {
    console.error('[cron] Error llamando a la tienda:', err)
    process.exitCode = 1
  })
