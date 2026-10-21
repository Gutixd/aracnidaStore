/** "23 al 29 de octubre" / "28 de octubre al 3 de noviembre" */
export function formatArrival(from: string, to: string): string {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const mes = (m: number) =>
    ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'][m - 1]
  if (from === to) return `${fd} de ${mes(fm)}`
  if (fy === ty && fm === tm) return `${fd} al ${td} de ${mes(tm)}`
  return `${fd} de ${mes(fm)} al ${td} de ${mes(tm)}`
}
