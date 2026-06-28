/**
 * Popula o conteúdo (Lexical rich text) das páginas institucionais criadas pelo seed.
 * Executa: node scripts/seed-paginas-conteudo.mjs
 * Requer servidor rodando em localhost:3003 com CAMARA=taquari.
 */

const BASE = 'http://localhost:3003'
const EMAIL = 'francistk@gmail.com'
const SENHA = 'Pass821200!'

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  })
  if (r.ok) return (await r.json()).token
  throw new Error('Login falhou: ' + r.status)
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

// ── Helpers Lexical ──────────────────────────────────────────────────────────
const t = (text) => ({ type: 'text', text, version: 1 })
const p = (...texts) => ({
  type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
  children: texts.map(t),
})
const h2 = (text) => ({
  type: 'heading', tag: 'h2', version: 1, direction: 'ltr', format: '', indent: 0,
  children: [t(text)],
})
const doc = (...nodes) => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: nodes },
})

// ── Conteúdos ────────────────────────────────────────────────────────────────
const PAGINAS = [
  {
    slug: 'a-camara',
    conteudo: doc(
      p('A Câmara Municipal de Taquari é o órgão legislativo do município, responsável por elaborar, discutir e votar as leis que regem a vida da cidade. Fundada junto com a emancipação política do município, a Câmara representa os cidadãos taquarienses por meio de seus vereadores eleitos a cada quatro anos.'),
      p('Taquari está localizada no Vale do Taquari, à margem direita do Rio Taquari, a 114 km de Porto Alegre. O município tem aproximadamente 28.000 habitantes e uma economia diversificada, com destaque para a indústria calçadista, a agropecuária e o comércio local.'),
      h2('Missão e atribuições'),
      p('Compete à Câmara Municipal legislar sobre os assuntos de interesse local, fiscalizar os atos do Poder Executivo, votar o orçamento anual e as leis de diretrizes orçamentárias, criar, transformar e extinguir cargos, empregos e funções públicas e fixar a remuneração dos servidores da Casa.'),
      p('A Câmara também exerce função de controle político-administrativo sobre o Poder Executivo Municipal, podendo convocar secretários, requisitar informações e instaurar comissões parlamentares de inquérito para apurar irregularidades de interesse público.'),
      h2('Composição e funcionamento'),
      p('O Legislativo taquariense é composto por 11 vereadores eleitos pelo sistema proporcional. As sessões ordinárias são realizadas semanalmente, às segundas-feiras, às 18h30, no Plenário da Câmara Municipal, localizado na Rua Daniel M Bizarro, 10, Centro. As sessões são abertas ao público e transmitidas ao vivo pelo canal oficial da Câmara no YouTube.'),
      p('O mandato atual (2025-2028) tem como Presidente o Ver. Ademir Fagundes (PDT), reeleito pelo terceiro mandato consecutivo. A Mesa Diretora também é composta pelos Vereadores Sérgio Pereira (1º Vice-Presidente), Marcelo Lopes (2º Vice-Presidente), Cláudio Bastos (1º Secretário) e Luis Porto (2º Secretário).'),
      h2('Transparência e acesso à informação'),
      p('Todas as sessões, matérias legislativas, atas e documentos oficiais são publicados neste portal e no Diário Oficial Eletrônico. O cidadão pode acompanhar o andamento de projetos de lei, consultar votações e pautas de sessões na seção de Atividade Parlamentar. Solicitações de informação podem ser realizadas pelo canal e-SIC, conforme a Lei de Acesso à Informação (Lei 12.527/2011).'),
    ),
  },
  {
    slug: 'mesa-diretora',
    conteudo: doc(
      p('A Mesa Diretora é o órgão de direção dos trabalhos legislativos e dos serviços administrativos da Câmara Municipal. Eleita anualmente pelos vereadores, a Mesa é responsável por presidir as sessões, organizar a pauta, zelar pelo patrimônio e representar institucionalmente a Casa.'),
      h2('Composição 2025–2028'),
      p('Presidente: Vereador Ademir Bica Fagundes (PDT) — reeleito pelo terceiro mandato consecutivo, Ademir Fagundes exerce a presidência desde 2022. Formado em Administração, é empresário do ramo agropecuário e um dos parlamentares mais experientes da Casa.'),
      p('1º Vice-Presidente: Vereador Sérgio Bioextinset Pereira (PDT) — empresário do ramo de serviços ambientais, exerce o primeiro mandato. Responde pela presidência nas ausências e impedimentos do titular.'),
      p('2º Vice-Presidente: Vereador Marcelo Bernstein Lopes (PDT) — advogado e assessor jurídico. É responsável pelos trabalhos de redação e revisão dos atos legislativos aprovados pelo plenário.'),
      p('1º Secretário: Vereador José Harry Saraiva Dias (PDT) — agricultor e pecuarista, representante das comunidades rurais do município. Responsável pelas secretarias e controle dos documentos da Casa.'),
      p('2º Secretário: Vereador Cláudio Ehlers Bastos (PDT) — empresário do setor de serviços. Auxilia nas funções de secretaria e substituição dos membros da Mesa nos impedimentos.'),
      h2('Atribuições'),
      p('Compete à Mesa Diretora: dirigir os trabalhos legislativos e os serviços administrativos; organizar a pauta das sessões; interpretar e fazer cumprir o Regimento Interno; propor ao Plenário projetos de resolução que disponham sobre organização ou funcionamento da Câmara; e representar a Câmara em juízo ou fora dele.'),
    ),
  },
  {
    slug: 'ramais',
    conteudo: doc(
      p('Para entrar em contato com a Câmara Municipal de Taquari, utilize os canais abaixo. O atendimento presencial é realizado de segunda a sexta-feira, das 8h30 às 11h30 e das 13h30 às 16h30.'),
      h2('Endereço'),
      p('Câmara Municipal de Taquari'),
      p('Rua Daniel M Bizarro, 10 — Centro'),
      p('Taquari/RS — CEP 95860-000'),
      h2('Telefone e e-mail'),
      p('Telefone geral: (51) 91005-8085'),
      p('E-mail institucional: contato@camarataquari.rs.gov.br'),
      h2('Setores e ramais'),
      p('Presidência: ramal 201'),
      p('Secretaria Legislativa: ramal 202'),
      p('Assessoria de Imprensa: ramal 203'),
      p('Protocolo e Correspondências: ramal 204'),
      p('Departamento Administrativo/Financeiro: ramal 205'),
      p('Assessoria Jurídica: ramal 206'),
      h2('Atendimento ao cidadão'),
      p('Para pedidos de acesso à informação (LAI), utilize o canal e-SIC disponível neste portal. Para denúncias e sugestões, utilize o canal de Ouvidoria. Ambos os serviços são gratuitos e possuem prazo legal de resposta de até 20 dias úteis.'),
    ),
  },
  {
    slug: 'carta-de-servicos',
    conteudo: doc(
      p('A Carta de Serviços ao Cidadão da Câmara Municipal de Taquari apresenta os serviços prestados pela Casa Legislativa, com informações sobre como acessá-los, prazos, documentos necessários e canais de atendimento. Esta carta segue as determinações do Decreto Federal nº 9.094/2017 e da Lei nº 13.460/2017.'),
      h2('Serviços legislativos'),
      p('Consulta de matérias legislativas: acesso gratuito ao sistema de pesquisa de projetos de lei, requerimentos, atas e demais documentos legislativos pelo portal (seção Atividade Parlamentar) ou presencialmente na Secretaria Legislativa. Prazo de disponibilização: imediato para documentos publicados; até 5 dias para documentos históricos.'),
      p('Cópia de atos normativos: o cidadão pode solicitar cópia de leis, decretos legislativos e resoluções no balcão de atendimento ou pelo e-mail institucional. Prazo: até 5 dias úteis. Documentos disponíveis no portal são fornecidos imediatamente.'),
      h2('Serviços de transparência'),
      p('Pedido de Acesso à Informação (e-SIC): qualquer cidadão pode solicitar informações sobre atos e gastos da Câmara pelo canal e-SIC deste portal, sem necessidade de justificativa. Prazo legal de resposta: até 20 dias úteis, prorrogável por mais 10 com justificativa.'),
      p('Ouvidoria: canal para reclamações, sugestões, elogios e denúncias sobre os serviços da Câmara. O retorno ao cidadão é realizado em até 30 dias. Os dados são publicados trimestralmente no portal.'),
      h2('Sessões plenárias'),
      p('As sessões ordinárias são públicas e realizadas às segundas-feiras, às 18h30, no Plenário da Câmara (Rua Daniel M Bizarro, 10). O público pode assistir presencialmente ou acompanhar pela transmissão ao vivo no YouTube. A pauta da sessão é disponibilizada no portal com antecedência mínima de 24 horas.'),
      p('Para uso da Tribuna Livre — espaço reservado à manifestação de cidadãos e representantes de entidades — o interessado deve se inscrever com antecedência mínima de 48 horas pelo telefone ou e-mail institucional. Cada participante dispõe de 5 minutos de fala.'),
      h2('Protocolo'),
      p('O protocolo geral da Câmara recebe documentos de segunda a sexta-feira, das 8h30 às 11h30 e das 13h30 às 16h30. Todo documento recebido é registrado e o interessado recebe número de protocolo para acompanhamento. Também é possível protocolar documentos pelo serviço online disponível neste portal.'),
    ),
  },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔑 Fazendo login...')
  const token = await login()
  console.log('✅ Login OK')

  const lista = await api(token, 'GET', '/paginas?limit=50')
  const paginas = lista.docs ?? []
  console.log(`\nPáginas existentes: ${paginas.map((p) => p.slug).join(', ')}`)

  for (const dados of PAGINAS) {
    const existente = paginas.find((p) => p.slug === dados.slug)
    if (!existente) {
      console.log(`\n⚠️  Página "${dados.slug}" não encontrada — pulando.`)
      continue
    }

    console.log(`\n📝 Atualizando "${dados.slug}" (id=${existente.id})...`)
    const res = await api(token, 'PATCH', `/paginas/${existente.id}`, { conteudo: dados.conteudo })
    if (res.doc?.id || res.id) {
      console.log(`  ✅ Atualizada.`)
    } else {
      console.log('  ❌ Erro:', JSON.stringify(res).slice(0, 300))
    }
  }

  console.log('\n✅ Seed de conteúdo concluído.')
}

main().catch(console.error)
