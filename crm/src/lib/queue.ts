import { Queue, type ConnectionOptions } from 'bullmq'

/**
 * Conexão Redis (opções) + filas BullMQ. Passamos um objeto de opções (não uma instância
 * ioredis) para o BullMQ criar a própria conexão — evita conflito entre a versão do ioredis
 * do app e a embutida no BullMQ. maxRetriesPerRequest: null é exigência do BullMQ.
 */
const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6380')
export const connection: ConnectionOptions = {
  host: url.hostname,
  port: Number(url.port || 6379),
  maxRetriesPerRequest: null,
}

export interface ComunicacaoJob {
  comunicacaoId: string
  camaraId: string
  gabineteId: string
}

const globalForQueue = globalThis as unknown as { filaComunicacoes?: Queue<ComunicacaoJob> }

export const filaComunicacoes: Queue<ComunicacaoJob> =
  globalForQueue.filaComunicacoes ?? new Queue<ComunicacaoJob>('comunicacoes', { connection })
if (process.env.NODE_ENV !== 'production') globalForQueue.filaComunicacoes = filaComunicacoes

// Fila de manutenção: jobs periódicos (cutuca, futuramente aniversários).
const globalForManut = globalThis as unknown as { filaManutencao?: Queue }
export const filaManutencao: Queue =
  globalForManut.filaManutencao ?? new Queue('manutencao', { connection })
if (process.env.NODE_ENV !== 'production') globalForManut.filaManutencao = filaManutencao

export function enfileirarComunicacao(job: ComunicacaoJob) {
  return filaComunicacoes.add('enviar', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  })
}
