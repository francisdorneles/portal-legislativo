/** Formatadores transversais (datas, etc.). */

/**
 * Converte uma string de data do SAPL em Date. Para datas só-dia (YYYY-MM-DD)
 * constrói no fuso LOCAL — senão o JS interpreta como UTC meia-noite e, em
 * fusos negativos (BR = GMT-3), a data exibida cai um dia para trás.
 */
function parseData(iso: string): Date {
  const soDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (soDia) {
    return new Date(Number(soDia[1]), Number(soDia[2]) - 1, Number(soDia[3]))
  }
  return new Date(iso)
}

/** Data por extenso curta em pt-BR. Ex.: "23/06/2026". Vazio se nulo. */
export function formatarData(iso?: string | null): string {
  if (!iso) return ''
  const d = parseData(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

/** Data + hora em pt-BR. Ex.: "23/06/2026 18:00". */
export function formatarDataHora(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
