/**
 * Worker BullMQ — processo SEPARADO do Next. Roda: pnpm worker
 * Consome a fila 'comunicacoes' e entrega cada comunicação (via worker-core).
 */
import { Worker } from 'bullmq'
import { connection, filaManutencao, type ComunicacaoJob } from './lib/queue.js'
import { processarComunicacao } from './modules/crm/comunicacoes.worker-core.js'
import { scanCutucaRelacionamento } from './modules/crm/cutuca.worker-core.js'
import { scanAniversariantes } from './modules/crm/aniversario.worker-core.js'

const workerComunicacoes = new Worker<ComunicacaoJob>(
  'comunicacoes',
  async (job) => {
    const r = await processarComunicacao(job.data)
    console.log(`[comunicacoes] job ${job.id}: ${r} (comunicacao ${job.data.comunicacaoId})`)
    return r
  },
  { connection, concurrency: 5 },
)
workerComunicacoes.on('failed', (job, err) => console.error(`[comunicacoes] job ${job?.id} falhou:`, err.message))

const workerManutencao = new Worker(
  'manutencao',
  async (job) => {
    if (job.name === 'cutuca') {
      const n = await scanCutucaRelacionamento()
      console.log(`[manutencao] cutuca: ${n} alerta(s) gerado(s)`)
      return n
    }
    if (job.name === 'aniversario') {
      const n = await scanAniversariantes()
      console.log(`[manutencao] aniversário: ${n} alerta(s) gerado(s)`)
      return n
    }
  },
  { connection },
)
workerManutencao.on('failed', (job, err) => console.error(`[manutencao] job ${job?.id} falhou:`, err.message))

// agenda jobs diários. upsert é idempotente — não duplica a cada restart.
await filaManutencao.upsertJobScheduler('cutuca-diaria', { pattern: '0 8 * * *' }, { name: 'cutuca' })
await filaManutencao.upsertJobScheduler('aniversario-diario', { pattern: '0 7 * * *' }, { name: 'aniversario' })

console.log('Workers no ar (comunicações + manutenção). Cutuca 08:00 · aniversário 07:00 (diário).')
