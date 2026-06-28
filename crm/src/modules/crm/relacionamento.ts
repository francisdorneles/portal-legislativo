/**
 * Termômetro de relacionamento — derivado do tempo desde o último contato.
 * Função PURA (sem dependência de framework/banco) → testável headless.
 *
 * Limiares (dias sem contato):
 *   quente    : <= 30
 *   esfriando : 31..90
 *   frio      : > 90 OU nunca contatado
 */
export type Temperatura = 'quente' | 'esfriando' | 'frio'

export const LIMIAR_ESFRIANDO = 30
export const LIMIAR_FRIO = 90

export function diasDesde(ultimoContato: Date | null, agora: Date = new Date()): number | null {
  if (!ultimoContato) return null
  const ms = agora.getTime() - ultimoContato.getTime()
  return Math.floor(ms / 86_400_000)
}

export function temperatura(ultimoContato: Date | null, agora: Date = new Date()): Temperatura {
  const dias = diasDesde(ultimoContato, agora)
  if (dias === null || dias > LIMIAR_FRIO) return 'frio'
  if (dias > LIMIAR_ESFRIANDO) return 'esfriando'
  return 'quente'
}

export const TEMP_LABEL: Record<Temperatura, string> = {
  quente: 'Quente',
  esfriando: 'Esfriando',
  frio: 'Frio',
}

export const TEMP_COR: Record<Temperatura, string> = {
  quente: 'bg-green-100 text-green-800',
  esfriando: 'bg-amber-100 text-amber-800',
  frio: 'bg-red-100 text-red-700',
}
