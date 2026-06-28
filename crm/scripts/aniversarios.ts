/** Roda o scan de aniversariantes agora (todos os gabinetes). pnpm aniversarios */
import { prisma } from '../src/lib/prisma.js'
import { scanAniversariantes } from '../src/modules/crm/aniversario.worker-core.js'

const n = await scanAniversariantes()
console.log(`Aniversários: ${n} alerta(s) gerado(s).`)
await prisma.$disconnect()
