// Tarea programada de Hostinger (Cron Jobs → Node.js → scripts/cron.js).
// Publica en Instagram lo que esté programado para hoy llamando al endpoint de
// la tienda. Hostinger ejecuta este archivo con las variables de entorno de la
// app (--env-file), así que CRON_SECRET se lee de acá y no se escribe en
// ningún comando ni en el panel de cron.
//
// Reemplaza al cron de Vercel (vercel.json), que ya no corre en Hostinger.

// Hostinger solo deja elegir "cada hora" con confiabilidad, así que este script
// corre cada hora y SOLO actúa a la hora de Chile indicada (13:00 por defecto,
// la misma franja que tenía en Vercel). Así no depende de la zona horaria del
// servidor ni del cambio de horario de verano.
const HORA_CHILE = Number(process.env.CRON_HORA_CHILE ?? 13)
const horaActual = Number(
  new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', hour: '2-digit', hour12: false }).format(new Date())
)
if (horaActual !== HORA_CHILE) {
  console.log(`[cron] ${horaActual}:00 en Chile; solo se publica a las ${HORA_CHILE}:00. Nada que hacer.`)
  process.exit(0)
}

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
