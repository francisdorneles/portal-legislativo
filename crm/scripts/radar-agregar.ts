/**
 * Vincula locais de votação a bairros (tabela curada) e imprime as agregações do Radar.
 *
 * Uso:  pnpm radar:agregar [tabelaJson] [camaraId]
 * Defaults: tabela = spike-crm/amostras/locais-votacao-taquari.json · camara = camara-taquari
 *
 * Pré-requisito: resultados importados (pnpm radar:importar). Roda no contexto da câmara.
 */
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import {
  lerTabelaLocais,
  lerPoligonosBairros,
  vincularLocaisABairros,
  type PoligonosPorBairro,
} from '../src/modules/radar/agregacao.js'
import { agregarVotosPorBairro, agregarVotosPorSecao } from '../src/modules/radar/radar.queries.js'

const TABELA = resolve(process.cwd(), process.argv[2] ?? 'spike-crm/amostras/locais-votacao-taquari.json')
const CAMARA_ID = process.argv[3] ?? 'camara-taquari'
const POLIGONOS = resolve(process.cwd(), 'spike-crm/amostras/bairros-taquari.geojson')

async function main() {
  const camara = await prisma.camara.findUnique({ where: { id: CAMARA_ID } })
  if (!camara) {
    console.error(`❌ Câmara "${CAMARA_ID}" não encontrada. Rode pnpm db:seed.`)
    process.exit(1)
  }
  const tabela = lerTabelaLocais(TABELA)
  let poligonos: PoligonosPorBairro | undefined
  try {
    poligonos = lerPoligonosBairros(POLIGONOS)
  } catch {
    console.warn('⚠️  GeoJSON de bairros não encontrado — usando centroides.')
  }

  await runComTenant({ camaraId: camara.id, gabineteId: 'n/a' }, async () => {
    const resumo = await vincularLocaisABairros(tabela, poligonos)
    console.log('🔗 Vínculo local→bairro:', JSON.stringify(resumo))

    const bairros = await agregarVotosPorBairro({ cargo: 'Vereador' })
    console.log('\n📊 Votos por bairro (Vereador 2024):')
    for (const b of bairros) console.log(`   ${String(b.votos).padStart(6)}  ${b.bairro}`)

    const secoes = await agregarVotosPorSecao({ cargo: 'Vereador' })
    console.log(`\n🗳️  Seções com voto: ${secoes.length} (top 5 por volume):`)
    for (const s of secoes.slice(0, 5))
      console.log(`   ${String(s.votos).padStart(6)}  Z${s.zona}/S${s.secao}  ${s.localVotacao}`)
  })

  await prisma.$disconnect()
  console.log('\n🎉 Agregação concluída.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
