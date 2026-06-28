/**
 * Seed de demonstração: 1 câmara (Taquari), 2 gabinetes, 1 usuário de login e cidadãos
 * em cada gabinete — para ver o isolamento funcionando no navegador.
 *
 * Login demo:  vereador.a@taquari.rs  /  demo1234
 *
 * Roda: pnpm db:seed  (banco no ar + pnpm db:push antes)
 */
import { PrismaClient } from '@prisma/client'
import { hashSenha } from '../src/modules/auth/auth-core.js'

const prisma = new PrismaClient()

async function main() {
  // ordem respeita as FKs (filhos antes dos pais)
  await prisma.resultadoEleitoral.deleteMany({})
  await prisma.unidadeTerritorial.deleteMany({})
  await prisma.movimentacaoDemanda.deleteMany({})
  await prisma.demanda.deleteMany({})
  await prisma.comunicacaoEnviada.deleteMany({})
  await prisma.alerta.deleteMany({})
  await prisma.documentoGabinete.deleteMany({})
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  // IDs FIXOS: re-semear não muda os ids → sessões abertas continuam válidas (sem FK quebrada).
  const CAMARA_ID = 'camara-taquari'
  const GAB_A = 'gab-a'
  const GAB_B = 'gab-b'

  const camara = await prisma.camara.create({
    data: {
      id: CAMARA_ID,
      nome: 'Câmara Municipal de Taquari',
      municipio: 'Taquari',
      uf: 'RS',
      codigoIbge: '4321303',
      // Taquari não usa SAPL (site é .gov.br) → saplUrl null. O conector SAPL existe e é plugável
      // (`modules/conectores/sapl.ts`, PoC `pnpm poc:sapl` testa ao vivo c/ General Câmara),
      // mas só liga se a câmara-cliente usar Interlegis. Não há UI; não invadir a demo.
    },
  })
  const gabA = await prisma.gabinete.create({
    data: {
      id: GAB_A,
      camaraId: camara.id,
      nome: 'Gabinete A',
      // vínculo eleitoral p/ o Mapa de Disputa (nome EXATO do TSE)
      candidatoTse: 'LUCIANO FABIANO MARIA DA SILVA',
    },
  })
  const gabB = await prisma.gabinete.create({ data: { id: GAB_B, camaraId: camara.id, nome: 'Gabinete B' } })

  await prisma.usuario.create({
    data: {
      camaraId: camara.id, gabineteId: gabA.id,
      email: 'vereador.a@taquari.rs', nome: 'Vereador A',
      senhaHash: await hashSenha('demo1234'),
    },
  })

  const hojeMenos = (dias: number) => new Date(Date.now() - dias * 86_400_000)
  await prisma.cidadao.createMany({
    data: [
      { camaraId: camara.id, gabineteId: gabA.id, nome: 'Maria Oliveira', bairro: 'Centro', ultimoContato: hojeMenos(5) }, // quente
      { camaraId: camara.id, gabineteId: gabA.id, nome: 'João Pereira', bairro: 'São José', ultimoContato: hojeMenos(50) }, // esfriando
      { camaraId: camara.id, gabineteId: gabA.id, nome: 'Ana Souza', bairro: 'Navegantes' }, // frio (nunca contatado)
      { camaraId: camara.id, gabineteId: gabB.id, nome: 'INVISÍVEL (gabinete B)', bairro: 'Outro' },
    ],
  })

  // volume de demo p/ a grid (busca + paginação): ~36 contatos variados no gab A
  const nomes = [
    'Carlos Almeida', 'Fernanda Lima', 'Roberto Dias', 'Juliana Castro', 'Marcos Vieira',
    'Patrícia Rocha', 'Eduardo Nunes', 'Camila Freitas', 'Rafael Moraes', 'Beatriz Campos',
    'Gustavo Pinto', 'Larissa Teixeira', 'André Barbosa', 'Vanessa Cardoso', 'Felipe Ramos',
    'Tatiane Gomes', 'RodrigoMendes', 'Aline Carvalho', 'Bruno Azevedo', 'Sabrina Lopes',
    'Diego Fernandes', 'Renata Martins', 'Leandro Costa', 'Priscila Antunes', 'Vinícius Cunha',
    'Daniela Ribeiro', 'Thiago Moreira', 'Carla Bastos', 'Maurício Farias', 'Letícia Duarte',
    'Anderson Pires', 'Bianca Nogueira', 'Wesley Tavares', 'Simone Aguiar', 'Gabriel Pacheco', 'Natália Brito',
  ]
  const bairrosDemo = ['Centro', 'São João', 'Santo Antônio', 'Prado', 'Léo Alvim Faller', 'Coqueiros', 'Praia']
  await prisma.cidadao.createMany({
    data: nomes.map((nome, i) => ({
      camaraId: camara.id,
      gabineteId: gabA.id,
      nome,
      email: nome.toLowerCase().replace(/[^a-z]+/g, '.') + '@email.com',
      telefone: `5199${String(1000000 + i).slice(-7)}`,
      bairro: bairrosDemo[i % bairrosDemo.length],
      tipoContato: i % 6 === 0 ? ('LIDERANCA' as const) : ('CIDADAO' as const),
      tags: i % 3 === 0 ? ['apoiador'] : i % 3 === 1 ? ['indeciso'] : [],
      ultimoContato: i % 4 === 0 ? null : hojeMenos((i * 7) % 120),
    })),
  })

  // demandas em bairros do Radar (p/ mapa, cruzamento voto×demanda e prestação de contas)
  const b = (camaraId: string) => ({ camaraId, gabineteId: gabA.id })
  await prisma.demanda.createMany({
    data: [
      // Centro — bairro forte, mostra trabalho
      { ...b(camara.id), titulo: 'Buraco na via', tema: 'asfalto', bairro: 'Centro', status: 'ABERTA', lat: -29.7985, lng: -51.8639 },
      { ...b(camara.id), titulo: 'Praça sem manutenção', tema: 'praças', bairro: 'Centro', status: 'RESOLVIDA', lat: -29.7995, lng: -51.8651 },
      { ...b(camara.id), titulo: 'Semáforo quebrado', tema: 'trânsito', bairro: 'Centro', status: 'RESOLVIDA', lat: -29.7989, lng: -51.8644 },
      // São João
      { ...b(camara.id), titulo: 'Poste sem luz', tema: 'iluminação', bairro: 'São João', status: 'RESOLVIDA', lat: -29.8093, lng: -51.8607 },
      { ...b(camara.id), titulo: 'Coleta de lixo irregular', tema: 'limpeza', bairro: 'São João', status: 'EM_ANDAMENTO', lat: -29.8090, lng: -51.8612 },
      // Santo Antônio
      { ...b(camara.id), titulo: 'Falta de ronda', tema: 'segurança', bairro: 'Santo Antônio', status: 'RESOLVIDA', lat: -29.7915, lng: -51.8631 },
      // Prado
      { ...b(camara.id), titulo: 'Vazamento de água', tema: 'saneamento', bairro: 'Prado', status: 'RESOLVIDA', lat: -29.7880, lng: -51.8539 },
      // Léo Alvim Faller
      { ...b(camara.id), titulo: 'Reforma da escola', tema: 'educação', bairro: 'Léo Alvim Faller', status: 'ENCAMINHADA', lat: -29.7798, lng: -51.8476 },
    ],
  })

  // comunicações de "demanda resolvida" (prova de trabalho / retorno ao cidadão)
  const maria = await prisma.cidadao.findFirst({ where: { gabineteId: gabA.id, nome: 'Maria Oliveira' } })
  const resolvidas = await prisma.demanda.findMany({ where: { gabineteId: gabA.id, status: 'RESOLVIDA' }, select: { id: true, titulo: true } })
  if (maria) {
    await prisma.comunicacaoEnviada.createMany({
      data: resolvidas.map((d) => ({
        camaraId: camara.id, gabineteId: gabA.id, cidadaoId: maria.id, demandaId: d.id,
        tipo: 'demanda_resolvida', conteudo: `Sua demanda "${d.titulo}" foi resolvida.`, enviadaEm: new Date(),
      })),
    })
  }

  console.log('Seed OK. Login: vereador.a@taquari.rs / demo1234')
  console.log('O dashboard deve mostrar 2 cidadãos (gab. A) e NUNCA o do gabinete B.')
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
