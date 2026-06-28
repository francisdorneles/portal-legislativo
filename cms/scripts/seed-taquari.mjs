/**
 * Seed de notícias REAIS da Câmara Municipal de Taquari.
 * Fonte: camarataquari.rs.gov.br
 * Executa: node scripts/seed-taquari.mjs
 * Requer servidor rodando em localhost:3003 com CAMARA=taquari.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
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

async function uploadImagem(token, numNoticia) {
  const imgPath = resolve(__dirname, `../public/noticias/noticia${numNoticia}.jpg`)
  let fileData
  try {
    fileData = readFileSync(imgPath)
  } catch {
    console.log(`  Imagem noticia${numNoticia}.jpg não encontrada, pulando...`)
    return null
  }

  const form = new FormData()
  const blob = new Blob([fileData], { type: 'image/jpeg' })
  form.append('file', blob, `noticia${numNoticia}.jpg`)
  form.append('_payload', JSON.stringify({ alt: `Câmara Municipal de Taquari - Notícia ${numNoticia}` }))

  const r = await fetch(`${BASE}/api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const json = await r.json()
  if (json.doc?.id) {
    console.log(`  Upload noticia${numNoticia}.jpg → id=${json.doc.id}`)
    return json.doc.id
  }
  console.log(`  Upload noticia${numNoticia}.jpg FALHOU:`, JSON.stringify(json).slice(0, 200))
  return null
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

// ── Dados das notícias (reais) ───────────────────────────────────────────────
// imagem: número do arquivo noticia{N}.jpg
const NOTICIAS = [
  {
    imagem: 87,
    titulo: 'Câmara aprecia e aprova projetos voltados à assistência social, esporte e saúde',
    slug: 'camara-aprova-projetos-assistencia-social-esporte-saude',
    data: '2026-06-08T10:00:00.000Z',
    corpo: doc(
      p('Durante sessão ordinária realizada em 8 de junho de 2026, a Câmara Municipal de Taquari apreciou requerimentos de homenagem, solicitações comunitárias e projetos do Poder Executivo nas áreas de assistência social, esporte e saúde pública. A sessão contou com a presença de 10 dos 11 vereadores e foi presidida pelo Ver. Ademir Fagundes (PDT).'),
      p('Na abertura dos trabalhos, foram aprovados requerimentos de homenagem ao Centro de Tradições Gaúchas Pelego Branco, que completa 70 anos de atividades culturais no município, ao Grupo Escoteiro Presidente Costa e Silva, que celebra 56 anos de formação de jovens, e à Sociedade Esportiva e Cultural Juventude, com 43 anos de história no esporte taquariense. Os requerimentos foram aprovados por unanimidade, com aplausos dos presentes nas galerias.'),
      h2('Projetos de Lei aprovados'),
      p('O primeiro projeto aprovado foi o PL nº 6.200/26, de autoria do Poder Executivo, que autoriza a abertura de crédito especial de R$ 240.000,00 em favor do Lar São José. O repasse será realizado em parcelas mensais de R$ 20.000,00 para o custeio do Serviço de Convivência e Fortalecimento de Vínculos (SCFV), que atende crianças, adolescentes e idosos em situação de vulnerabilidade social no município.'),
      p('Em seguida, foi aprovado o PL nº 6.202/26, autorizando repasse anual de R$ 86.400,00 ao Grêmio Esportivo Taquariense, dividido em 12 parcelas mensais de R$ 7.200,00. Os recursos serão destinados ao custeio de atividades esportivas gratuitas oferecidas à comunidade, incluindo futebol, futsal e escolinhas para crianças e adolescentes.'),
      p('O PL nº 6.203/26 abriu crédito especial de R$ 654.124,00 para a Secretaria Municipal da Saúde, com o objetivo de reforçar o orçamento para aquisição de medicamentos, insumos e manutenção de equipamentos nas unidades básicas de saúde do município.'),
      h2('Solicitações comunitárias'),
      p('Os vereadores aprovaram ainda uma série de requerimentos solicitando ao Poder Executivo melhorias em diversas regiões do município: manutenção de estradas vicinais no interior, instalação de iluminação pública em ruas sem luz elétrica na zona urbana e a revisão do itinerário de uma linha de transporte coletivo que deixou de atender o bairro Praia após a última mudança de operador.'),
      p('O Ver. Aldo Gregory (PP) destacou a importância de manter o diálogo com as comunidades do interior: "Nossa obrigação é trazer para o plenário as demandas que chegam até nós. O cidadão do interior merece a mesma atenção que o da cidade." A sessão foi encerrada às 21h30.'),
    ),
  },
  {
    imagem: 86,
    titulo: 'Câmara aprecia homenagens, projetos de interesse público e créditos para saúde e infraestrutura',
    slug: 'camara-homenagens-projetos-saude-infraestrutura',
    data: '2026-06-01T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou na noite de 1° de junho de 2026 sua sessão ordinária semanal, com pauta extensa que incluiu homenagens, projetos de lei do Executivo e requerimentos de informação. A sessão reuniu os 11 vereadores e foi aberta com um minuto de silêncio em homenagem a um morador do bairro Bancários falecido na semana anterior.'),
      p('A sessão começou com a concessão de Títulos de Cidadão Benemérito a duas personalidades locais. O primeiro homenageado foi o Professor Antônio Carlos da Cruz Dutra, atleta multimedalhista em modalidades aquáticas e fundador da Escola de Natação Pinheiros Dutra, que forma nadadores há mais de três décadas em Taquari. O segundo título foi concedido a Renato Pereira Martins, pela longa trajetória na área contábil e pela gestão da Cooperativa de Energia CERTAJA.'),
      h2('Projetos aprovados na sessão'),
      p('O PL 6.192/26 institui o prazo máximo de 20 minutos para atendimento presencial nos setores da Câmara Municipal, em conformidade com a legislação federal sobre direitos dos cidadãos no atendimento público. O projeto foi apresentado pelo Ver. Luciano Fabiano Maria da Silva (PT) após reclamações de munícipes sobre demoras no atendimento.'),
      p('O PL 6.194/26 abriu crédito adicional de R$ 14.653,81 para construção e adequação de uma pista de caminhada no bairro São Luiz, atendendo demanda antiga de moradores da região. A pista terá 400 metros de extensão e contará com iluminação e área de descanso.'),
      p('O PL 6.195/26 autorizou repasse de R$ 25.000,00 à Sociedade Esportiva São José para construção de vestiários no campo de futebol da instituição. A entidade atende mais de 200 atletas de categorias de base.'),
      h2('Requerimentos e debates'),
      p('Os vereadores também debateram o atraso nas obras de pavimentação de ruas no bairro Figueira, com o Ver. Marcelo Lopes (PDT) cobrando prazo do Executivo para conclusão dos serviços. O secretário de Obras informou que as obras devem ser retomadas em julho com a chegada de novos equipamentos. A sessão foi encerrada às 22h15 após aprovação de mais cinco requerimentos de informação ao Poder Executivo.'),
    ),
  },
  {
    imagem: 85,
    titulo: 'Sessão Ordinária de 18 de maio de 2026',
    slug: 'sessao-ordinaria-18-maio-2026',
    data: '2026-05-18T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária em 18 de maio de 2026, com pauta que incluiu requerimentos, projetos de lei e tribuna livre. A sessão contou com a participação de representantes da comunidade e foi presidida pelo Ver. Ademir Fagundes (PDT).'),
      p('Na parte de requerimentos, os vereadores aprovaram pedidos de informação ao Poder Executivo sobre obras em andamento, contratações emergenciais e o andamento do processo de habilitação de novas empresas de coleta de resíduos sólidos no município.'),
      h2('Projetos de Lei'),
      p('Foi aprovado projeto de lei autorizando a abertura de crédito especial no orçamento municipal para custeio de despesas emergenciais na área da saúde, incluindo a contratação temporária de profissionais para suprir a demanda nas UBS durante o inverno.'),
      p('Outro projeto aprovado regulamenta a participação de representantes da sociedade civil nas reuniões das comissões permanentes da Câmara, ampliando a transparência dos trabalhos legislativos e o controle social sobre as decisões do plenário.'),
      h2('Tribuna Livre'),
      p('Na Tribuna Livre, representantes de moradores do bairro Novo Horizonte solicitaram providências para a conclusão das obras de saneamento básico na área, paralisadas há mais de dois anos por problemas contratuais. O presidente da Câmara comprometeu-se a convidar o secretário de Obras para prestar esclarecimentos em sessão futura.'),
    ),
  },
  {
    imagem: 84,
    titulo: 'Câmara aprova projetos voltados à cultura, esporte, assistência social e segurança náutica',
    slug: 'camara-aprova-cultura-esporte-seguranca-nautica',
    data: '2026-05-11T10:00:00.000Z',
    corpo: doc(
      p('Na sessão ordinária de 11 de maio de 2026, sete matérias foram aprovadas unanimemente pelos 11 vereadores da Câmara Municipal de Taquari. A pauta diversificada contemplou reconhecimentos culturais, investimentos no esporte e segurança nas atividades náuticas praticadas no Rio Taquari.'),
      p('O destaque da sessão foi o PL nº 6.178/26, de autoria do Ver. Aldo Gregory (PP), que reconhece oficialmente as celebrações da Novena e Festa de São José como patrimônio cultural imaterial do município de Taquari. O projeto ressalta que a tradição, realizada anualmente no mês de março na Igreja Matriz de São José, representa "práticas profundamente enraizadas na identidade, na tradição e na memória da comunidade taquariense", reunindo milhares de fiéis e devotos de toda a região do Vale do Taquari.'),
      p('O PL nº 6.179/26 estabeleceu parceria entre a Câmara Municipal e a Associação Náutica Taquari para o projeto "Salvatagem e Segurança Náutica no Rio Taquari", com repasse de R$ 150.000,00 para aquisição de equipamentos de salvatagem, realização de cursos de capacitação para socorristas aquáticos e campanhas de conscientização sobre segurança nas atividades náuticas. O projeto ganhou urgência após dois acidentes aquáticos registrados no município nos últimos dois anos.'),
      h2('Demais matérias aprovadas'),
      p('Foram aprovados ainda projetos destinando recursos ao Grêmio Náutico Taquari (R$ 60.000,00 para manutenção de embarcações e infraestrutura da sede), à Academia Desportiva Taquari — ADT (R$ 45.000,00 para material esportivo e custeio das categorias de base em atletismo) e à Associação dos Paraplégicos e Amputados de Taquari — APAT (R$ 30.000,00 para custeio de sessões de fisioterapia e aquisição de cadeiras de rodas para associados).'),
      p('O Ver. Leco Da Cecilia (Avante) destacou a importância do projeto de segurança náutica: "O Rio Taquari é parte da vida da nossa cidade. Precisamos garantir que ele seja um espaço de lazer seguro para todos, especialmente no verão, quando o movimento é muito maior."'),
    ),
  },
  {
    imagem: 83,
    titulo: 'Sessão Ordinária de 04 de maio de 2026',
    slug: 'sessao-ordinaria-04-maio-2026',
    data: '2026-05-04T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária em 4 de maio de 2026. A sessão contou com a participação de todos os vereadores e foi marcada pela apreciação de matérias legislativas nas áreas de saúde pública, educação e assistência social.'),
      p('Os vereadores aprovaram por unanimidade oito requerimentos solicitando informações ao Executivo Municipal sobre contratos de serviços públicos, andamento de obras e aplicação de recursos federais recebidos pelo município para programas sociais.'),
      h2('Audiência Pública sobre Corsan/Aegea'),
      p('A sessão aprovou a realização de audiência pública para debate sobre os serviços prestados pela concessionária Corsan/Aegea no município. A data definida foi 7 de maio, às 19h, no plenário da Câmara, com convite aberto à população para manifestações sobre qualidade no fornecimento de água e tarifas cobradas.'),
      p('O Ver. Aldo Gregory, autor do requerimento, afirmou que a audiência é resultado de numerosas reclamações de moradores sobre falta de água em bairros e distritos, além de questionamentos sobre o valor das faturas após a privatização do serviço. "É hora de a população ter espaço para se manifestar e a concessionária prestar contas", disse o vereador.'),
      h2('Outros destaques'),
      p('Foi aprovado projeto de lei criando programa de capacitação profissional para jovens entre 16 e 24 anos em situação de vulnerabilidade social. O programa prevê parceria com o SENAI e SENAC para oferta de cursos gratuitos nas áreas de informática, gastronomia e serviços gerais.'),
    ),
  },
  {
    imagem: 82,
    titulo: 'Câmara aprova matérias e destaca participação comunitária',
    slug: 'camara-aprova-materias-participacao-comunitaria',
    data: '2026-04-27T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária com pautas diversificadas, incluindo requerimentos, projetos de lei, homenagens e espaço para participação comunitária via Tribuna Livre pelo CTG Pelego Branco.'),
      p('Foi realizada eleição para 2º Secretário da Mesa Diretora, com Cláudio Bastos (PDT) eleito por 6 votos a 1, sucedendo Luis Porto na função.'),
      h2('Matérias aprovadas'),
      p('Entre as matérias aprovadas por unanimidade destacam-se requerimentos sobre infraestrutura urbana solicitando informações sobre a Rua Cleonita Viana Santos e providências da Corsan/Aegea quanto a vazamentos em vias públicas.'),
      p('A sessão incluiu manifestações de pesar em homenagem a falecidos, votos de congratulações a instituições como CDL Taquari/Tabaí e Motasa, além de projetos importantes como a inclusão da Câmara em roteiros turísticos municipais.'),
      p('Foram aprovados projetos regulamentando o Camping Municipal Nestor de Azambuja Guimarães e autorizando parceria com o Grupo Escoteiro Presidente Costa e Silva, com repasse de R$ 54.000,00 de emenda parlamentar federal.'),
      h2('Tribuna Livre'),
      p('Na Tribuna Livre, representantes do CTG Pelego Branco apresentaram projetos culturais e solicitaram apoio da Câmara para a realização do Rodeio Municipal. O presidente da Câmara, Ver. Ademir Fagundes, parabenizou a entidade pela relevância cultural e prometeu encaminhar as demandas ao Executivo.'),
    ),
  },
  {
    imagem: 81,
    titulo: 'Sessão Ordinária de 06 de abril de 2026',
    slug: 'sessao-ordinaria-06-abril-2026',
    data: '2026-04-06T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária na segunda-feira, 06 de abril de 2026. Entre as matérias aprovadas estavam cinco indicações solicitando melhorias urbanas, como conserto de uma tampa de bueiro quebrada e recuperação de calçamentos em diferentes áreas da cidade.'),
      p('Também foi aprovado o Projeto de Lei nº 6.167/26, que extingue o cargo de Procurador Jurídico e cria o de Coordenador Jurídico, visando modernizar e tornar mais eficiente a organização administrativa da Câmara Municipal.'),
      h2('Mudanças na composição parlamentar'),
      p('A sessão também formalizou informações sobre a exoneração do secretário de Saúde Municipal e seu retorno às atividades na Câmara, com os consequentes reajustes na composição da suplência parlamentar previstos no regimento interno.'),
      p('O Ver. Sérgio Pereira destacou a importância de manter o quadro completo de vereadores para garantir a representatividade da população nas deliberações plenárias. "Cada vereador representa um segmento da nossa comunidade e sua presença é fundamental para decisões equilibradas", afirmou.'),
      h2('Requerimentos de infraestrutura'),
      p('Os vereadores aprovaram ainda requerimentos solicitando informações sobre o cronograma de obras de pavimentação em bairros periféricos, o andamento das obras de construção do novo prédio da Secretaria Municipal de Saúde e o processo licitatório para contratação de empresa de manutenção de equipamentos hospitalares.'),
    ),
  },
  {
    imagem: 80,
    titulo: 'Sessão Ordinária de 30 de março de 2026',
    slug: 'sessao-ordinaria-30-marco-2026',
    data: '2026-03-30T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária em 30 de março de 2026, aprovando duas proposições principais de grande impacto social para o município.'),
      p('A primeira foi um voto de congratulações à Equipe Santiago, pela comemoração de seus 8 anos de atuação esportiva no município. O fundador Tiago Rosa recebeu pessoalmente um quadro de reconhecimento pelas mãos dos parlamentares, em cerimônia emocionante realizada no plenário da Câmara. A equipe reúne mais de 80 atletas de diversas idades na prática de musculação e esportes de combate.'),
      h2('Parceria com a APAE'),
      p('O Projeto de Lei nº 6.166/26 autorizou parceria com a APAE Taquari/RS para cedência de nove profissionais com investimento mensal de R$ 78.372,19, visando promover ações voltadas às pessoas com deficiência intelectual, deficiência múltipla e Transtorno Global do Desenvolvimento.'),
      p('A diretora da APAE, Eliane Fischer, esteve presente na sessão e agradeceu o apoio da Câmara: "Esses profissionais são fundamentais para manter a qualidade dos serviços prestados às mais de 150 famílias atendidas pela APAE em Taquari e região." O projeto foi aprovado por unanimidade com votos de congratulações à entidade.'),
      h2('Audiência Pública agendada'),
      p('Também foi agendada audiência pública para 7 de maio às 19h, solicitada pelo Vereador Aldo Gregory, a fim de abordar os serviços da Corsan/Aegea e questões relacionadas a tarifas e atendimento ao consumidor no município.'),
    ),
  },
  {
    imagem: 79,
    titulo: 'Sessão Ordinária de 23 de março de 2026',
    slug: 'sessao-ordinaria-23-marco-2026',
    data: '2026-03-23T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou uma sessão ordinária em que aprovou unanimemente diversos projetos e requerimentos. Entre as matérias aprovadas estavam votos de congratulações para o Pombo Correyo F.C. (21 anos de atuação) e Esporte Clube Pinheiros (95 anos).'),
      p('Foram aprovados requerimentos solicitando informações sobre eventuais atrasos na distribuição de faturas aos usuários do município junto à RGE e à ANEEL. Também foi aprovada a realização de uma Audiência Pública para debater os serviços prestados pela Corsan/Aegea no município.'),
      h2('Homenagem à Festa de São José'),
      p('Voto de congratulações foi concedido aos organizadores da Festa de São José, que completou 218 anos no município. A festa, realizada anualmente no mês de março, é considerada uma das mais antigas tradições religiosas do Rio Grande do Sul e reúne milhares de devotos de toda a região.'),
      h2('Projetos do Executivo aprovados'),
      p('Na esfera executiva, aprovaram-se quatro projetos de lei: um convênio com o município de Tabaí para acolhimento de crianças vítimas de violência; normas para instalação de estações transmissoras de radiocomunicação no município; crédito especial de R$ 103.961,23 para eventos culturais; e autorização para intervenções em redes de esgotamento pluvial em propriedades particulares em casos de emergência.'),
    ),
  },
  {
    imagem: 78,
    titulo: 'Sessão Ordinária de 16 de março de 2026',
    slug: 'sessao-ordinaria-16-marco-2026',
    data: '2026-03-16T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal realizou sessão ordinária em 16 de março, aprovando diversos requerimentos, moções e projetos de lei com amplo espectro de impacto na vida do município.'),
      p('Entre as deliberações, destaca-se a oficialização à Corsan/Aegea para recolocação da pavimentação asfáltica da Av. Promissão, danificada durante obras de manutenção da rede de abastecimento de água. Também foram aprovados votos de pesar por falecimentos na comunidade e solicitação de melhorias no anel viário municipal.'),
      h2('Parcerias e convênios'),
      p('A Câmara aprovou a autorização de parcerias com a APAE e a Casa da Criança, garantindo a continuidade dos serviços prestados pelas duas entidades à população mais vulnerável do município. Os repasses combinados somam R$ 95.000,00 mensais.'),
      p('Também foi aprovado um acordo judicial sobre permuta de imóveis para ampliação do Cemitério Municipal, que estava com capacidade esgotada. A solução encontrada garante a aquisição de uma área contígua ao cemitério existente sem ônus adicional ao erário municipal.'),
      h2('Créditos especiais'),
      p('A sessão aprovou a abertura de diversos créditos especiais totalizando aproximadamente R$ 4,65 milhões para as áreas de educação, habitação, cultura, agricultura e outras áreas. Os recursos têm origem em transferências federais e estaduais destinadas especificamente a esses fins.'),
    ),
  },
  {
    imagem: 77,
    titulo: 'Sessão Ordinária de 09 de março de 2026',
    slug: 'sessao-ordinaria-09-marco-2026',
    data: '2026-03-09T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária na segunda-feira, 09 de março de 2026, aprovando unanimemente cinco matérias principais.'),
      p('Foram aprovados quatro requerimentos: o primeiro solicita esclarecimentos à ANATEL sobre infraestrutura de telecomunicações e imóvel da OI S/A localizados na Rua Sete de Setembro; o segundo requer informações sobre conclusão da praça no Loteamento Bela Vista e instalação de playground; o terceiro busca informações sobre legislação municipal acerca de edificações próximas a arroios; e o quarto propõe comissão para solicitar conclusão das obras de pavimentação da TK-36.'),
      h2('Projetos do Executivo'),
      p('Foram aprovados três projetos de lei do Executivo: instituição da Rede de Apoio Escolar para promover ações intersetoriais voltadas à garantia do direito à educação de crianças e adolescentes em situação de vulnerabilidade; autorização de parceria com a APAE Taquari com repasse de R$ 86.737,77 do FUMDICA; e autorização de parceria com a Associação Desportiva Pinheiros Dutra com repasse de R$ 54.688,61 do FUMDICA.'),
      h2('Tribuna Livre'),
      p('Na Tribuna Livre, o grupo Garagem 74 solicitou providências para construção de local apropriado para "arrancadões" no Capão, apresentando estudo de viabilidade do espaço e proposta de regramento para as atividades. O presidente da Câmara encaminhou a solicitação à Secretaria de Obras para avaliação técnica.'),
    ),
  },
  {
    imagem: 76,
    titulo: 'Câmara retoma as sessões ordinárias após recesso',
    slug: 'camara-retoma-sessoes-apos-recesso',
    data: '2026-03-02T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari reuniu-se em sessão ordinária no dia 02 de março, retomando as atividades após recesso parlamentar de fevereiro. Foram aprovados por unanimidade 10 requerimentos, incluindo votos de pesar e congratulações, solicitações de fiscalização de serviços públicos (Corsan/Aegea e AGERGS), limpeza de imóvel da OI S/A e expansão de rede de água.'),
      p('Também foram aprovados 6 projetos de lei relacionados à denominação de Unidade Básica de Saúde, instituição da Procuradoria Especial da Mulher na Câmara Municipal, abertura de créditos especiais para Obras, Habitação e Saneamento Básico, além de 1 projeto de resolução e 30 indicações encaminhadas ao Executivo.'),
      h2('Procuradoria da Mulher'),
      p('O projeto de criação da Procuradoria Especial da Mulher na Câmara Municipal foi destaque da sessão. A nova estrutura terá como objetivo orientar, defender e proteger os direitos das mulheres, encaminhar às autoridades competentes os casos de violência contra a mulher e sugerir medidas legislativas e políticas públicas voltadas ao público feminino.'),
      p('A vereadora responsável pela proposta afirmou que a medida vai ao encontro das demandas das mulheres taquarienses e complementa a rede de proteção já existente no município. "Queremos que toda mulher saiba que tem um espaço aqui na Câmara para ser ouvida e ter seus direitos defendidos", declarou.'),
    ),
  },
  {
    imagem: 75,
    titulo: 'Visita institucional do IFSul e Câmara de Triunfo',
    slug: 'visita-ifsul-camara-triunfo',
    data: '2026-02-26T10:00:00.000Z',
    corpo: doc(
      p('Na manhã de 26 de fevereiro, a Câmara Municipal de Taquari recebeu representantes da Câmara de Triunfo e do IFSul. A comitiva visitou a Casa Legislativa em agradecimento pela aprovação de Moção de Apoio à instalação de um Campus do IFSul no Município de Triunfo, em 2025.'),
      p('O encontro objetivou fortalecer a cooperação entre municípios e definir próximas etapas, como formas de ingresso de alunos, mapeamento de cursos de interesse da região e parcerias para garantir o transporte de alunos de toda a área de abrangência do campus.'),
      h2('Campus do IFSul em Triunfo'),
      p('O Dr. Elias Medeiros Vieira, futuro diretor do campus, destacou que a conquista resultou de esforço "apartidário dos Poderes Executivo, Legislativo, Judiciário e OAB". O Instituto oferecerá educação técnica de nível médio com cerca de 40 professores inicialmente, podendo atender em torno de 800 alunos de toda a região do Vale do Taquari, incluindo estudantes de Taquari.'),
      p('Os vereadores taquarienses presentes reafirmaram disposição para aprofundar laços institucionais regionais. Ao encerrar, a Câmara recebeu material informativo e uma insígnia do IFSul em reconhecimento pelo apoio prestado. O presidente da Câmara de Taquari ressaltou que o campus representará oportunidades para os jovens da região sem necessidade de se deslocar para grandes centros.'),
    ),
  },
  {
    imagem: 74,
    titulo: 'Sessão Extraordinária de 28 de janeiro de 2026',
    slug: 'sessao-extraordinaria-28-janeiro-2026',
    data: '2026-01-28T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão extraordinária remota em 28 de janeiro, aprovando por unanimidade três projetos de lei do Executivo Municipal com impacto direto nas áreas de saúde, agricultura e habitação.'),
      p('O primeiro projeto autoriza convênio com a Associação Taquariense de Saúde para repasse mensal de R$ 76.578,70, viabilizando a habilitação do município ao Programa Assistir estadual na especialidade de oftalmologia. Com isso, os moradores de Taquari terão acesso a consultas e cirurgias oftalmológicas pelo SUS sem precisar se deslocar para municípios maiores.'),
      h2('Apoio à agricultura e habitação'),
      p('O segundo projeto aprova parceria com associação de produtores rurais de Porto Grande, repassando R$ 22.800,00 para locação de balsa destinada ao escoamento da produção agrícola. A medida beneficia produtores que precisam atravessar o Rio Taquari para escoar sua produção até as cooperativas e armazéns da região.'),
      p('O terceiro projeto altera legislação sobre o Programa Minha Casa, Minha Vida, incluindo isenção de ISSQN e ITBI nas transações de primeira e segunda aquisição habitacional. A medida visa facilitar o acesso à moradia própria para famílias de baixa renda do município.'),
    ),
  },
  {
    imagem: 73,
    titulo: 'Sessão Ordinária de 26 de janeiro de 2026',
    slug: 'sessao-ordinaria-26-janeiro-2026',
    data: '2026-01-26T10:00:00.000Z',
    corpo: doc(
      p('A sessão ordinária da Câmara Municipal ocorreu na segunda-feira, 26 de janeiro, aprovando por unanimidade diversos requerimentos e projetos de lei. Entre as matérias apreciadas destacam-se: votos de congratulações ao Sr. Pedro Haetinger pela vitória na Travessia Torres-Tramandaí; e solicitação de esclarecimentos à concessionária Rota de Santa Maria sobre o fechamento de acessos na RSC-287.'),
      p('Também foram aprovadas homenagem à empresa Comercial Elétrica Adelso Costa pelos 20 anos de atuação no município, e solicitação de informações ao Executivo sobre os horários de ônibus do transporte coletivo municipal, que passaram por alterações sem comunicação prévia à população.'),
      h2('Projetos de lei aprovados'),
      p('Foram aprovados três projetos de lei referentes a créditos especiais e convênios com a Associação Taquariense de Saúde para realização de consultas e procedimentos cirúrgicos no Hospital São José. Os repasses totalizam R$ 230.000,00 para o primeiro semestre de 2026.'),
      p('A sessão marcou o encerramento das atividades ordinárias antes do recesso parlamentar em fevereiro, com retorno previsto para 2 de março. O presidente da Câmara agradeceu aos vereadores pelo trabalho desenvolvido ao longo do primeiro mês do ano legislativo.'),
    ),
  },
  {
    imagem: 72,
    titulo: 'Câmara aprova reajustes anuais do Município em Sessão Extraordinária',
    slug: 'camara-aprova-reajustes-anuais-municipio',
    data: '2026-01-23T10:00:00.000Z',
    corpo: doc(
      p('Os vereadores aprovaram por unanimidade dez projetos de lei em sessão extraordinária realizada em 23 de janeiro de 2026, visando a reposição salarial frente à inflação dos últimos 12 meses, acrescido de reajuste salarial, perfazendo o total de 6%.'),
      p('As medidas abrangem diversas categorias funcionais, servidores públicos, conselheiros tutelares, estagiários, gestores municipais e vereadores. Os percentuais aplicados foram 4,26% conforme o IPCA mais 1,74% de aumento real, com vigência a partir de janeiro de 2026.'),
      h2('Categorias contempladas'),
      p('O reajuste abrange todos os servidores efetivos da administração direta e indireta, incluindo profissionais da saúde, educação, assistência social e serviços gerais. Os conselheiros tutelares também foram contemplados, seguindo orientação do Conselho Nacional dos Direitos da Criança e do Adolescente.'),
      p('O secretário de Finanças explicou que o reajuste está previsto no orçamento municipal aprovado em dezembro e não compromete o equilíbrio fiscal do município. "Demos ao servidor público o tratamento que ele merece, garantindo a manutenção do poder de compra após um ano de inflação acima da meta", declarou.'),
    ),
  },
  {
    imagem: 71,
    titulo: 'Sessão Ordinária de 19 de janeiro de 2026',
    slug: 'sessao-ordinaria-19-janeiro-2026',
    data: '2026-01-19T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou uma sessão ordinária na última segunda-feira, aprovando por unanimidade diversos requerimentos. Os pedidos abrangeram solicitações ao DAER para construção de ciclovia, refazimento de sinalização e operação de manutenção de asfalto em rodovias estaduais que cortam o município.'),
      p('O vereador Aldo Gregory apresentou requerimentos ao Executivo sobre projetos de restauração de prédios históricos e solicitou informações sobre investimentos públicos previstos para o interior do município em 2026. "A falta de abastecimento tem se tornado rotineira", destacou o vereador ao defender sua moção sobre problemas no fornecimento de água na região do Rincão.'),
      h2('Sessões nos bairros e distritos'),
      p('Alguns requerimentos foram retirados após sugestão do líder governista para reduzir o volume de demandas e priorizar as mais urgentes. Os vereadores também se comprometeram em retomar sessões legislativas nos bairros e distritos durante 2026, visando aproximação com a população local — prática interrompida durante os anos de restrições sanitárias da pandemia.'),
      p('O presidente da Câmara informou que as sessões itinerantes começarão a partir de março, com calendário a ser divulgado à comunidade. "Queremos ouvir diretamente da população quais são suas prioridades e levar o parlamento para perto de quem mais precisa", afirmou Ver. Ademir Fagundes.'),
    ),
  },
  {
    imagem: 70,
    titulo: 'Vereadores realizam visita institucional à TK Calçados',
    slug: 'vereadores-visita-tk-calcados',
    data: '2026-01-15T10:00:00.000Z',
    corpo: doc(
      p('Representantes do poder legislativo municipal visitaram a empresa TK Calçados, localizada na Av. Farrapos, n. 2590, na manhã de 15 de janeiro. O proprietário Tiago Kunzler apresentou as instalações fabris aos vereadores da Mesa Diretora eleita para 2026.'),
      p('A fábrica possui um total de 250 funcionários, sendo que do total, 120 trabalhadores foram contratados recentemente. A produção atinge cerca de 20 mil pares de calçados por dia, em exclusividade para a Calçados Beira-Rio. A empresa oferece transporte dedicado para seus empregados em todos os bairros do município.'),
      h2('Incentivos fiscais e impacto econômico'),
      p('Participaram da visita os vereadores Sérgio Pereira, Marcelo Lopes, Cláudio Bastos e Luis Porto. A TK Calçados beneficiou-se de incentivos fiscais aprovados pela Câmara Municipal, incluindo a cessão de pavilhão com 4 mil metros quadrados pelo período de dez anos.'),
      p('Durante 2025, a Câmara aprovou dez leis de incentivos conforme o Programa de Desenvolvimento Industrial de Taquari (PROTAQ), visando estimular investimentos e industrialização municipal. O secretário de Desenvolvimento Econômico estima que as empresas beneficiadas pelo PROTAQ geraram mais de 500 novos postos de trabalho diretos no último ano.'),
    ),
  },
  {
    imagem: 69,
    titulo: 'Retomada dos trabalhos com a 1ª Sessão Ordinária de 2026',
    slug: 'retomada-trabalhos-1-sessao-ordinaria-2026',
    data: '2026-01-12T10:00:00.000Z',
    corpo: doc(
      p('Na sessão ordinária de segunda-feira, a Câmara Municipal de Taquari retomou suas atividades legislativas após o recesso de final de ano. Foram aprovados diversos requerimentos, incluindo solicitações de informações sobre obras de revitalização urbana, normas escolares e calendários de manutenção municipal.'),
      p('A sessão também homenageou profissionais da área da saúde pública através de votos de congratulações. Destacou-se a aprovação do Dia dos Profissionais do SAMU, instituindo 15 de janeiro como data comemorativa em reconhecimento aos profissionais de emergência que atuam no município.'),
      h2('Projetos aprovados'),
      p('Foram aprovados projetos de lei para criar um Centro Municipal de Atendimento Educacional Especializado (CMAE), que irá complementar os serviços de educação especial oferecidos pelo município para estudantes com necessidades educacionais específicas.'),
      p('Além disso, foram aprovados dois créditos especiais: um de R$ 251.860,30 para adequação orçamentária geral do exercício; e outro de R$ 2.056.000,00 destinado à construção de uma Unidade Básica de Saúde no bairro Prado, obra aguardada há anos pelos moradores daquela região.'),
    ),
  },
  {
    imagem: 68,
    titulo: 'Terno de Reis encerra o 33º Natal Açoriano na Câmara Municipal',
    slug: 'terno-de-reis-33-natal-acoriano',
    data: '2026-01-06T10:00:00.000Z',
    corpo: doc(
      p('Na noite de terça-feira, dia 06 de janeiro, ocorreram apresentações de Terno de Reis na Câmara Municipal e na Lagoa Armênia. Grupos de Taquari e região — de Bom Retiro do Sul, Paverama, Triunfo e Montenegro — participaram entoando versos e cantigas tradicionais da cultura açoriana.'),
      p('O Presidente da Câmara, Ver. Ademir Fagundes, abriu oficialmente o evento, seguido pela Vice-Prefeita Rosilene Santos. Vereadores e rainhas da Corte Açoriana entregaram certificados aos grupos participantes em reconhecimento à preservação da tradição.'),
      h2('33ª edição do Natal Açoriano'),
      p('O evento foi transmitido ao vivo pelos canais oficiais da Câmara Municipal no Facebook e YouTube. Nove grupos no total participaram da celebração da tradição açoriana, que marca o encerramento das comemorações natalinas em sua 33ª edição consecutiva.'),
      p('O Natal Açoriano é uma das festividades mais tradicionais de Taquari, celebrando a herança cultural dos colonizadores açorianos que chegaram à região no século XIX. A tradição dos Ternos de Reis, que chegam cantando para anunciar a chegada dos Reis Magos, é preservada por famílias e entidades culturais de toda a região.'),
    ),
  },
  {
    imagem: 67,
    titulo: 'Câmara realiza a última Sessão Ordinária de 2025',
    slug: 'ultima-sessao-ordinaria-2025',
    data: '2025-12-15T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sua última sessão ordinária do ano em 15 de dezembro de 2025, aprovando por unanimidade sete matérias que encerraram a agenda legislativa do exercício.'),
      p('Entre as matérias aprovadas, destacam-se votos de congratulações ao Ministério Internacional Rio de Glória pelos 16 anos de atuação no município, ao escritor João Paulo da Fontoura pelo livro "COSTA e SILVA", obra sobre a história do município, e ao Instituto Estadual de Educação Pereira Coruja pela premiação educacional recebida no cenário estadual.'),
      h2('Matérias legislativas aprovadas'),
      p('Foram aprovados projetos de lei para contratação de 50 profissionais de apoio escolar para auxiliar estudantes com necessidades especiais nas escolas municipais; instituição de declaração de utilidade pública para entidades sem fins lucrativos que atuam no município há mais de cinco anos; e operação de crédito de R$ 20 milhões com a Caixa Econômica Federal para financiamento de obras de infraestrutura.'),
      p('Também foram aprovados repasses financeiros para a Associação Taquariense de Saúde totalizando R$ 307.222,78 para o custeio de procedimentos cirúrgicos e consultas especializadas no Hospital São José até março de 2026.'),
    ),
  },
  {
    imagem: 66,
    titulo: 'Câmara realiza homenagem, Tribuna Livre, Sessão Extraordinária e Ordinária em um só dia',
    slug: 'camara-4-atos-em-sessao',
    data: '2025-12-11T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão plenária intensa em 11 de dezembro de 2025, na qual foram apresentados votações de congratulações, manifestações públicas pela Tribuna Livre, além de aprovações de projetos legislativos em sessão extraordinária e ordinária realizadas na mesma noite.'),
      p('Dentre os destaques, houve o recebimento das coordenadoras da 3ª Coordenadoria Regional de Educação para homenagem pela implantação de curso técnico em enfermagem na rede pública de Taquari — uma conquista importante para a formação de profissionais de saúde na região.'),
      h2('Tribuna Livre e demandas comunitárias'),
      p('Na Tribuna Livre, a entidade CDL apresentou propostas de organização de estacionamento nas vias centrais da cidade, argumentando que a falta de vagas regulamentadas prejudica o comércio local. A proposta foi encaminhada à Secretaria Municipal de Trânsito para avaliação técnica.'),
      h2('Matérias legislativas'),
      p('Foram aprovados por unanimidade diversos requerimentos, decretos legislativos concedendo títulos de cidadania a personalidades com trajetória relevante no município, e projetos de lei sobre parcerias com instituições assistenciais, fomento ao turismo, abertura de créditos especiais e convênios com a saúde municipal.'),
    ),
  },
  {
    imagem: 65,
    titulo: 'Eleita a Mesa Diretora da Câmara Municipal para 2026',
    slug: 'eleita-mesa-diretora-camara-2026',
    data: '2025-12-01T12:00:00.000Z',
    corpo: doc(
      p('No encontro de segunda-feira, 1° de dezembro de 2025, os vereadores elegeram a nova Mesa Diretora para 2026. Ademir Fagundes (PDT) foi reeleito presidente pela terceira vez consecutiva, demonstrando a confiança do plenário em sua liderança à frente da Casa Legislativa.'),
      p('A composição completa da Mesa Diretora para 2026 inclui: Sérgio Pereira como 1º Vice-Presidente, Marcelo Lopes como 2º Vice-Presidente, Cláudio Bastos como 1º Secretário e Luis Porto como 2º Secretário. Todos foram eleitos pelo conjunto dos vereadores presentes.'),
      h2('Comissões Permanentes'),
      p('Também foram definidas as lideranças partidárias e as comissões permanentes para o próximo exercício nas áreas de Justiça e Redação, Orçamento e Finanças, e Educação, Obras e Bem-Estar Social. As comissões são responsáveis pela análise técnica das matérias antes de sua votação no plenário.'),
      p('O presidente reeleito agradeceu pela confiança dos colegas e apresentou as prioridades para o mandato de 2026: modernização da Câmara, ampliação da transparência, retomada das sessões itinerantes nos bairros e distritos, e fortalecimento do relacionamento com a sociedade civil organizada.'),
    ),
  },
  {
    imagem: 64,
    titulo: 'Sessão Ordinária de 01 de dezembro de 2025',
    slug: 'sessao-ordinaria-01-dezembro-2025',
    data: '2025-12-01T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Taquari realizou sessão ordinária em 01/12/2025, aprovando por unanimidade vários projetos e requerimentos que marcaram o encerramento do calendário legislativo antes das festividades de fim de ano.'),
      p('Destaca-se a aprovação do Projeto de Lei n° 6.089/25, que proíbe o manuseio, utilização, queima e a soltura de fogos de artifício sonoros no Município, com exceções para fogos de vista sem estampido e artefatos pirotécnicos específicos. O projeto atende demanda de famílias com crianças, idosos e pessoas com deficiências sensoriais, além de proteger animais domésticos.'),
      h2('Orçamento Municipal 2026'),
      p('Também foi aprovado o Projeto de Lei n° 6.084/25, que fixa o orçamento municipal para 2026 em R$ 120.498.543,63. O orçamento foi elaborado com base nas projeções de receita e nas prioridades definidas no Plano Plurianual, priorizando investimentos em saúde, educação e infraestrutura.'),
      p('Foram aprovados ainda requerimentos de transferência de sessão para evitar coincidência com eventos municipais, votos de congratulações a entidades e cidadãos destacados, e outras matérias legislativas de interesse local.'),
    ),
  },
  {
    imagem: 63,
    titulo: 'Sessão Extraordinária e Ordinária de 24 de novembro de 2025',
    slug: 'sessao-extraordinaria-e-ordinaria-24-novembro-2025',
    data: '2025-11-24T10:00:00.000Z',
    corpo: doc(
      p('A Câmara Municipal de Vereadores de Taquari realizou reunião extraordinária em 24 de novembro de 2025, aprovando unanimemente três projetos de lei para concessão de incentivos materiais a empresas locais conforme a Lei nº 1.493/1994 de desenvolvimento industrial.'),
      p('O primeiro beneficiou a Luka Mecânica Diesel Ltda., com 2.923 m³ de rachão para aterro, viabilizando a construção de uma nova oficina. A empresa se comprometeu a ampliar o quadro de funcionários de 4 para 20 empregos até 2028, gerando renda direta para famílias taquarienses.'),
      h2('Incentivos à industrialização'),
      p('O segundo projeto contemplou a JR Serviço e Manutenção Industrial com 3.000 m³ de terra para aterro, permitindo a ampliação das instalações da empresa que presta serviços a indústrias da região. O terceiro destinou-se à All Serviços Industriais, com custeio mensal de R$ 4.500,00 por 12 meses para apoiar a expansão das operações.'),
      h2('Sessão Ordinária subsequente'),
      p('Na sessão ordinária subsequente, aprovaram-se diversos requerimentos incluindo pedidos de segurança viária em pontos críticos do município, votos de congratulações e pesar, além de projetos de lei instituindo o Dia do Agente Comunitário de Saúde, a função de Prefeito de Praça para gestão de espaços públicos, isenção de IPTU para imóveis afetados pela enchente de maio/junho de 2024, e abertura de crédito especial de R$ 100.000,00 para obras emergenciais.'),
    ),
  },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔑 Fazendo login...')
  const token = await login()
  console.log('✅ Login OK')

  // 1. Apagar todas as notícias existentes
  console.log('\n🗑️  Apagando notícias existentes...')
  const lista = await api(token, 'GET', '/noticias?limit=200')
  const ids = lista.docs?.map((d) => d.id) ?? []
  for (const id of ids) {
    await api(token, 'DELETE', `/noticias/${id}`)
    process.stdout.write('.')
  }
  if (ids.length) console.log(`\n  ${ids.length} notícias removidas.`)

  // 2. Upload de imagens + criação de notícias
  console.log('\n📰 Criando notícias com imagens reais...')
  let criadas = 0

  for (const n of NOTICIAS) {
    console.log(`\n[${criadas + 1}/${NOTICIAS.length}] ${n.titulo.slice(0, 60)}...`)

    const fotoId = await uploadImagem(token, n.imagem)

    const payload = {
      titulo: n.titulo,
      slug: n.slug,
      data: n.data,
      publicado: true,
      corpo: n.corpo,
      ...(fotoId ? { foto: fotoId } : {}),
    }

    const res = await api(token, 'POST', '/noticias', payload)
    if (res.doc?.id || res.id) {
      console.log(`  ✅ Criada (id=${res.doc?.id ?? res.id})`)
      criadas++
    } else {
      console.log('  ❌ Erro:', JSON.stringify(res).slice(0, 300))
    }
  }

  console.log(`\n✅ Seed concluído: ${criadas}/${NOTICIAS.length} notícias criadas.`)
}

main().catch(console.error)
