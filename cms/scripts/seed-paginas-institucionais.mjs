/**
 * Cria as páginas institucionais no Payload e as vincula ao menu.
 * Executa: node scripts/seed-paginas-institucionais.mjs
 * Requer servidor rodando em localhost:3003.
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
  if (!r.ok) throw new Error('Login falhou: ' + r.status)
  return (await r.json()).token
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await r.json()
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${JSON.stringify(json)}`)
  return json
}

// Lexical: parágrafo de texto
function p(text) {
  return {
    type: 'paragraph',
    version: 1,
    children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  }
}

function doc(...paragrafos) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: paragrafos,
    },
  }
}

// Páginas a criar — as que saíram do menu hardcoded e precisam existir no CMS.
const PAGINAS = [
  // ── Grupo: Institucional ───────────────────────────────────────────────────
  {
    titulo: 'História',
    slug: 'historia',
    menuGrupo: 'institucional',
    menuLabel: 'História',
    menuDesc: 'Origem e trajetória da Casa Legislativa',
    menuIcone: 'livro',
    conteudo: doc(
      p('A Câmara Municipal é o órgão legislativo do município, responsável por elaborar e aprovar as leis que regem a vida local.'),
      p('Edite esta página no painel administrativo para incluir a história da Casa Legislativa.'),
    ),
  },
  {
    titulo: 'Regimento Interno',
    slug: 'regimento-interno',
    menuGrupo: 'institucional',
    menuLabel: 'Regimento Interno',
    menuDesc: 'Regras que regem o funcionamento da Câmara',
    menuIcone: 'livro',
    conteudo: doc(
      p('O Regimento Interno disciplina o funcionamento da Câmara Municipal, estabelecendo normas para as sessões, votações e tramitação de matérias.'),
      p('Inclua aqui o texto do Regimento Interno vigente ou um link para o documento oficial.'),
    ),
  },
  {
    titulo: 'Títulos Honoríficos',
    slug: 'titulos-honorificos',
    menuGrupo: 'institucional',
    menuLabel: 'Títulos Honoríficos',
    menuDesc: 'Cidadãos e entidades homenageados pela Casa',
    menuIcone: 'livro',
    conteudo: doc(
      p('A Câmara Municipal pode conceder títulos honoríficos a cidadãos e entidades que prestaram relevantes serviços ao município.'),
      p('Edite esta página para listar os homenageados e as respectivas datas de aprovação.'),
    ),
  },
  {
    titulo: 'Escola do Legislativo',
    slug: 'escola-legislativo',
    menuGrupo: 'institucional',
    menuLabel: 'Escola do Legislativo',
    menuDesc: 'Educação cívica e capacitação legislativa',
    menuIcone: 'livro',
    conteudo: doc(
      p('A Escola do Legislativo tem como missão promover a educação cívica e a capacitação de servidores, vereadores e da sociedade civil.'),
      p('Edite esta página para divulgar cursos, eventos e materiais educativos.'),
    ),
  },
  // ── Grupo: Atendimento ────────────────────────────────────────────────────
  {
    titulo: 'Ramais e Telefones',
    slug: 'ramais',
    menuGrupo: 'atendimento',
    menuLabel: 'Ramais e Telefones',
    menuDesc: 'Contatos dos setores da Câmara',
    menuIcone: 'pessoas',
    conteudo: doc(
      p('Edite esta página para listar os ramais e telefones de cada setor da Câmara Municipal.'),
    ),
  },
  {
    titulo: 'Cidadania Legislativa',
    slug: 'cidadania-legislativa',
    menuGrupo: 'atendimento',
    menuLabel: 'Cidadania Legislativa',
    menuDesc: 'Visitas guiadas e educação cívica',
    menuIcone: 'balao',
    conteudo: doc(
      p('O programa de Cidadania Legislativa promove visitas guiadas à Câmara Municipal para estudantes e grupos da comunidade.'),
      p('Edite esta página para informar como agendar visitas e os demais programas de participação popular.'),
    ),
  },
]

async function main() {
  console.log('🔑 Autenticando…')
  const token = await login()

  for (const pg of PAGINAS) {
    // Verifica se já existe pelo slug
    const existente = await api(token, 'GET', `/paginas?where[slug][equals]=${pg.slug}&limit=1`)
    if (existente.docs?.length > 0) {
      console.log(`⏭  Já existe: ${pg.slug}`)
      continue
    }

    const criada = await api(token, 'POST', '/paginas', {
      titulo: pg.titulo,
      slug: pg.slug,
      menuGrupo: pg.menuGrupo,
      menuLabel: pg.menuLabel,
      menuDesc: pg.menuDesc,
      menuIcone: pg.menuIcone,
      conteudo: pg.conteudo,
    })
    console.log(`✅ Criada: ${pg.slug} (id ${criada.doc?.id ?? criada.id})`)
  }

  console.log('\nPronto! Acesse /admin → Páginas para editar o conteúdo.')
}

main().catch((e) => { console.error(e); process.exit(1) })
