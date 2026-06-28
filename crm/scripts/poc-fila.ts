/**
 * PoC da fila: (1) worker-core entrega/idempotência/isolamento; (2) volta completa
 * enfileirar → Worker BullMQ processa → enviadaEm marcado.
 * Roda: pnpm tsx scripts/poc-fila.ts  (banco + redis no ar)
 */
import { Worker } from 'bullmq'
import { prisma } from '../src/lib/prisma.js'
import { processarComunicacao } from '../src/modules/crm/comunicacoes.worker-core.js'
import { filaComunicacoes, enfileirarComunicacao, connection, type ComunicacaoJob } from '../src/lib/queue.js'

const ok = (n: string, c: boolean) => { console.log(`${c ? '✅' : '❌'} ${n}`); if (!c) process.exitCode = 1 }

async function novaComunicacao(gabineteId: string) {
  const cam = await prisma.camara.findFirst({})
  const cid = await prisma.cidadao.findFirst({ where: { gabineteId } })
  return prisma.comunicacaoEnviada.create({
    data: { camaraId: cam!.id, gabineteId, cidadaoId: cid!.id, tipo: 'demanda_resolvida', conteudo: 'teste' },
  })
}

async function main() {
  // PARTE 1 — processor direto
  const c1 = await novaComunicacao('gab-a')
  const r1 = await processarComunicacao({ comunicacaoId: c1.id, camaraId: 'camara-taquari', gabineteId: 'gab-a' })
  const c1b = await prisma.comunicacaoEnviada.findUnique({ where: { id: c1.id } })
  ok('1. entrega marca enviadaEm', r1 === 'enviada' && c1b?.enviadaEm != null)

  const r1again = await processarComunicacao({ comunicacaoId: c1.id, camaraId: 'camara-taquari', gabineteId: 'gab-a' })
  ok('2. idempotente (2ª vez ignorada)', r1again === 'ignorada')

  const c2 = await novaComunicacao('gab-a')
  const rIso = await processarComunicacao({ comunicacaoId: c2.id, camaraId: 'camara-taquari', gabineteId: 'gab-b' })
  const c2b = await prisma.comunicacaoEnviada.findUnique({ where: { id: c2.id } })
  ok('3. isolamento: gab B não entrega comunicação do A', rIso === 'ignorada' && c2b?.enviadaEm == null)

  // PARTE 2 — volta completa pela fila Redis
  const c3 = await novaComunicacao('gab-a')
  const worker = new Worker<ComunicacaoJob>('comunicacoes', async (job) => processarComunicacao(job.data), { connection })
  const concluido = new Promise<void>((res, rej) => {
    worker.on('completed', () => res())
    worker.on('failed', (_, e) => rej(e))
    setTimeout(() => rej(new Error('timeout')), 15000)
  })
  await enfileirarComunicacao({ comunicacaoId: c3.id, camaraId: 'camara-taquari', gabineteId: 'gab-a' })
  await concluido
  const c3b = await prisma.comunicacaoEnviada.findUnique({ where: { id: c3.id } })
  ok('4. fila Redis: enfileirar → worker → enviadaEm', c3b?.enviadaEm != null)

  // limpeza
  await prisma.comunicacaoEnviada.deleteMany({ where: { id: { in: [c1.id, c2.id, c3.id] } } })
  await worker.close()
  await filaComunicacoes.close()
  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️ Fila FALHOU' : '\n🎉 Fila OK')
  process.exit(process.exitCode ?? 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
