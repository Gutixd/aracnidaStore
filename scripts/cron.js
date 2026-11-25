// Tarea programada de Hostinger (Cron Jobs → Node.js → scripts/cron.js).
// Publica en Instagram lo que esté programado para hoy llamando al endpoint de
// la tienda. Hostinger ejecuta este archivo con las variables de entorno de la
// app (--env-file), así que CRON_SECRET se lee de acá y no se escribe en
// ningún comando ni en el panel de cron.
//
// Reemplaza al cron de Vercel (vercel.json), que ya no corre en Hostinger.

// ── Vigilante de procesos ──────────────────────────────────────────────────
// El plan de Hostinger permite 120 procesos (NPROC) para TODOS los sitios. El
// 24-nov la tienda se cayó porque se acumularon ~100 procesos de versiones
// viejas de las apps de Node que no se cerraron tras los redespliegues. Esto
// cuenta los procesos del usuario cada hora, deja en el registro cuántos hay
// por app y versión, y avisa por Telegram si se acercan al límite. No mata
// nada: solo avisa (en Hostinger → Uso de recursos → "Detener procesos").
const fs = require('fs')
const NPROC_LIMITE = 120
const NPROC_AVISO = Number(process.env.NPROC_AVISO ?? 80)

function contarProcesos() {
  const uid = typeof process.getuid === 'function' ? process.getuid() : null
  let hilos = 0
  const porVersion = {}
  for (const pid of fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d))) {
    try {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8')
      const procUid = Number((status.match(/^Uid:\s+(\d+)/m) || [])[1])
      if (uid !== null && procUid !== uid) continue
      const n = Number((status.match(/^Threads:\s+(\d+)/m) || [])[1] || 1)
      hilos += n
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ')
      const m = cmd.match(/domains\/([^/]+)\/hbuilds\/versions\/([0-9a-f-]{8})/)
      const clave = m ? `${m[1]}@${m[2]}` : cmd.includes('node') ? 'node (otro)' : 'otros'
      porVersion[clave] = (porVersion[clave] || 0) + n
    } catch {
      // el proceso terminó mientras se leía: se ignora
    }
  }
  return { hilos, porVersion }
}

async function vigilarProcesos() {
  if (!fs.existsSync('/proc')) return
  const { hilos, porVersion } = contarProcesos()
  const detalle = Object.entries(porVersion).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`).join(', ')
  console.log(`[cron] Procesos/hilos del plan: ${hilos}/${NPROC_LIMITE} → ${detalle}`)
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (hilos < NPROC_AVISO || !token || !chat) return
  const texto = `⚠️ <b>Hostinger casi sin procesos</b>\nEn uso: ${hilos} de ${NPROC_LIMITE}. ` +
    `Si llega al límite, la tienda deja de cargar.\n\n${detalle.replace(/</g, '&lt;')}\n\n` +
    `Solución: Hostinger → Uso de recursos → "Detener procesos en ejecución".`
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(15_000),
  }).catch((e) => console.error('[cron] No se pudo avisar por Telegram:', e))
}

// Hostinger solo deja elegir "cada hora" con confiabilidad, así que este script
// corre cada hora y SOLO actúa a la hora de Chile indicada (13:00 por defecto,
// la misma franja que tenía en Vercel). Así no depende de la zona horaria del
// servidor ni del cambio de horario de verano.
const HORA_CHILE = Number(process.env.CRON_HORA_CHILE ?? 13)

async function publicarInstagram() {
  const horaActual = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', hour: '2-digit', hour12: false }).format(new Date())
  )
  if (horaActual !== HORA_CHILE) {
    console.log(`[cron] ${horaActual}:00 en Chile; solo se publica a las ${HORA_CHILE}:00. Nada que hacer.`)
    return 0
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://aracnidastore.cl').replace(/\/$/, '')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron] Falta CRON_SECRET en las variables de entorno de la app')
    return 1
  }

  try {
    const res = await fetch(`${base}/api/cron/publish-instagram`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(110_000),
    })
    const body = await res.text()
    console.log(`[cron] ${new Date().toISOString()} → ${res.status} ${body.slice(0, 500)}`)
    return res.ok ? 0 : 1
  } catch (err) {
    console.error('[cron] Error llamando a la tienda:', err)
    return 1
  }
}

;(async () => {
  try {
    await vigilarProcesos()
  } catch (e) {
    console.error('[cron] Error vigilando procesos:', e)
  }
  // process.exit explícito: este script nunca debe quedar vivo (cada proceso
  // colgado resta del límite de 120 del plan).
  process.exit(await publicarInstagram())
})()
