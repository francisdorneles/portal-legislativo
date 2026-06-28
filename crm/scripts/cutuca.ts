/** Roda a cutuca de relacionamento agora (varre todos os gabinetes). pnpm cutuca */
import { prisma } from '../src/lib/prisma.js'
import { scanCutucaRelacionamento } from '../src/modules/crm/cutuca.worker-core.js'

const n = await scanCutucaRelacionamento()
console.log(`Cutuca: ${n} alerta(s) gerado(s).`)
await prisma.$disconnect()
