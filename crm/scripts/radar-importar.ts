/**
 * Import operacional dos resultados do TSE para uma câmara.
 *
 * Uso:
 *   pnpm radar:importar [caminhoCsv] [camaraId]
 * Defaults:
 *   csv     = spike-crm/amostras/tse-secao-taquari-vereador-2024.csv
 *   camaraId= camara-taquari   (id fixo do seed)
 *
 * Roda DENTRO do contexto da câmara (a extensão injeta camaraId). Idempotente por
 * (ano, cargo): reimportar não duplica.
 */
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { lerCsvTse, importarResultadosTse } from '../src/modules/radar/tse-import.js'

const CSV = resolve(
  process.cwd(),
  process.argv[2] ?? 'spike-crm/amostras/tse-secao-taquari-vereador-2024.csv',
)
const CAMARA_ID = process.argv[3] ?? 'camara-taquari'

async function main() {
  const camara = await prisma.camara.findUnique({ where: { id: CAMARA_ID } })
  if (!camara) {
    console.error(`❌ Câmara "${CAMARA_ID}" não encontrada. Rode pnpm db:seed ou passe um id válido.`)
    process.exit(1)
  }

  console.log(`📥 Lendo ${CSV} ...`)
  const linhas = lerCsvTse(CSV)
  console.log(`   ${linhas.length} linhas parseadas.`)

  const resumo = await runComTenant(
    { camaraId: camara.id, gabineteId: 'n/a' },
    async () => await importarResultadosTse(linhas),
  )

  for (const r of resumo) {
    console.log(`✅ ${r.ano} ${r.cargo}: -${r.removidos} removidos, +${r.inseridos} inseridos`)
  }
  await prisma.$disconnect()
  console.log(`🎉 Import concluído para "${camara.nome}".`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
