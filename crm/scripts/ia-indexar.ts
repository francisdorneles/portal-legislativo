/**
 * Indexação operacional do RAG para um gabinete.
 * Uso:  pnpm ia:indexar [gabineteId]   (default: gab-a do seed)
 * Usa o provedor de embedding configurado (IA_EMBED_PROVIDER; default 'stub' offline).
 */
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { indexarDemandasDoGabinete } from '../src/modules/ia/indexar.js'

const GAB = process.argv[2] ?? 'gab-a'

async function main() {
  const gab = await prisma.gabinete.findUnique({ where: { id: GAB }, select: { id: true, camaraId: true, nome: true } })
  if (!gab) {
    console.error(`❌ Gabinete "${GAB}" não encontrado. Rode pnpm db:seed.`)
    process.exit(1)
  }
  const r = await runComTenant({ camaraId: gab.camaraId, gabineteId: gab.id }, () => indexarDemandasDoGabinete())
  console.log(`✅ ${gab.nome}: ${r.indexados} ${r.origem}(s) indexada(s).`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
