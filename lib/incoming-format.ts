/** "del 23 al 29 de octubre" / "del 28 de octubre al 3 de noviembre" / "el 25 de octubre" */
export function formatArrival(from: string, to: string): string {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const mes = (m: number) =>
    ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'][m - 1]
  if (from === to) return `el ${fd} de ${mes(fm)}`
  if (fy === ty && fm === tm) return `del ${fd} al ${td} de ${mes(tm)}`
  return `del ${fd} de ${mes(fm)} al ${td} de ${mes(tm)}`
}
