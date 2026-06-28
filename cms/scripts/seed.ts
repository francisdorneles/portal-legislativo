/**
 * Seed de conteúdo editorial de exemplo (idempotente).
 * Rodar: pnpm seed   (usa `payload run`, que resolve config + aliases `@/`)
 *
 * Só semeia o que é do Payload (CMS): configurações da câmara, páginas
 * institucionais e notícias. Vereadores, comissões, mesa diretora e audiências
 * vêm do SAPL — semeados por `spike/seed-sapl.mjs` (ver docs/05).
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { camara } from '@/lib/camara.config'

/** Monta um SerializedEditorState lexical simples a partir de parágrafos. */
const rt = (...paras: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paras.map((t) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [
        { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text: t, version: 1 },
      ],
    })),
  },
})

const NOTICIAS = [
  { titulo: 'Câmara aprova ampliação do transporte escolar rural', categoria: 'sessoes', resumo: 'Proposta segue para sanção após votação unânime no plenário.', corpo: ['Em sessão ordinária, o plenário aprovou por unanimidade o projeto que amplia o transporte escolar na zona rural.', 'A medida deve beneficiar mais de 600 estudantes a partir do próximo semestre.'] },
  { titulo: 'Audiência pública debate o orçamento de 2027', categoria: 'comunicados', resumo: 'Encontro acontece no dia 28 e é aberto à população.', corpo: ['A Comissão de Finanças promove audiência pública para discutir a peça orçamentária de 2027.'] },
  { titulo: 'Nova lei institui a Semana da Cultura', categoria: 'projetos', resumo: 'Iniciativa valoriza artistas locais e o patrimônio histórico.', corpo: ['Sancionada a lei que cria a Semana da Cultura, com programação anual de eventos.'] },
  { titulo: 'Câmara realiza sessão solene de homenagem a profissionais da saúde', categoria: 'eventos', resumo: 'Cerimônia reconheceu o trabalho durante a pandemia.', corpo: ['Em sessão solene, a Casa homenageou profissionais da saúde do município.'] },
  { titulo: 'Projeto cria programa de incentivo ao primeiro emprego', categoria: 'projetos', resumo: 'Texto prevê parceria com empresas locais.', corpo: ['O projeto institui programa de incentivo à contratação de jovens em busca do primeiro emprego.'] },
]

const seed = async () => {
  const payload = await getPayload({ config })
  let crNot = 0

  // helper idempotente
  const existe = async (collection: string, where: object): Promise<{ id: number } | undefined> =>
    (await payload.find({ collection: collection as never, where: where as never, limit: 1, depth: 0 }))
      .docs[0] as unknown as { id: number } | undefined

  // Configurações da Câmara (Global) — popula com os defaults do código se ainda vazio.
  let crCfg = 0
  const cfgAtual = (await payload.findGlobal({ slug: 'configuracoes' })) as { camaraId?: string }
  if (cfgAtual?.camaraId !== camara.id) {
    await payload.updateGlobal({
      slug: 'configuracoes',
      data: {
        camaraId: camara.id,
        nomeOficial: camara.nomeOficial,
        nomeCurto: camara.nomeCurto,
        inicial: camara.inicial,
        cidade: camara.cidade,
        uf: camara.uf,
        plenario: camara.plenario,
        contato: {
          endereco: camara.contato.endereco,
          bairro: camara.contato.bairro,
          telefone: camara.contato.telefone,
          email: camara.contato.email,
          horario: camara.contato.horario,
        },
      } as never,
    })
    crCfg = 1
  }

  // Organograma default (só preenche se ainda estiver vazio) — câmara edita no admin.
  const cfgOrg = (await payload.findGlobal({ slug: 'configuracoes' })) as { organograma?: unknown[] }
  if (!cfgOrg?.organograma?.length) {
    await payload.updateGlobal({
      slug: 'configuracoes',
      data: {
        organograma: [
          { setor: 'Mesa Diretora', nivel: 'mesa', competencias: 'Direção dos trabalhos legislativos e administrativos da Casa.' },
          { setor: 'Presidência', nivel: 'mesa', competencias: 'Representa a Câmara e preside as sessões.' },
          { setor: 'Diretoria Geral', nivel: 'diretoria', competencias: 'Coordena os serviços administrativos e o apoio ao processo legislativo.' },
          { setor: 'Procuradoria Jurídica', nivel: 'diretoria', competencias: 'Assessoramento jurídico à Mesa e às comissões.' },
          { setor: 'Setor Legislativo', nivel: 'setor', competencias: 'Tramitação de proposições, pautas e atas.' },
          { setor: 'Comunicação', nivel: 'setor', competencias: 'Notícias, transmissões e atendimento à imprensa.' },
          { setor: 'Administração e Finanças', nivel: 'setor', competencias: 'Folha, compras, contratos e patrimônio.' },
          { setor: 'Ouvidoria e e-SIC', nivel: 'setor', competencias: 'Canal do cidadão e acesso à informação.' },
        ],
      } as never,
    })
  }

  // Páginas institucionais editoriais (História/Regimento — Mesa Diretora vem do SAPL)
  let crPag = 0
  const PAGINAS = [
    { titulo: 'História', slug: 'historia', conteudo: [`A ${camara.nomeOficial} é o órgão do Poder Legislativo do município, responsável por elaborar leis e fiscalizar o Executivo.`, 'Sua história acompanha o desenvolvimento da cidade desde a emancipação.'] },
    { titulo: 'Regimento Interno', slug: 'regimento-interno', conteudo: ['O Regimento Interno estabelece as regras de organização e funcionamento da Casa Legislativa: sessões, comissões, processo legislativo e ordem dos trabalhos.', 'Substitua este texto pelo regimento vigente ou anexe o documento oficial no CMS.'] },
    { titulo: 'Títulos Honoríficos', slug: 'titulos-honorificos', conteudo: ['A Câmara concede títulos honoríficos — como Cidadão Honorário e Cidadã Benemérita — a pessoas que prestaram relevantes serviços ao município, por meio de Decreto Legislativo.', 'Consulte os decretos na seção de Legislação. Edite este texto no CMS para listar os homenageados.'] },
    { titulo: 'Histórico de Prefeitos', slug: 'historico-prefeitos', conteudo: ['Relação dos prefeitos do município ao longo das legislaturas.', 'Edite esta página no CMS para incluir nomes, períodos e fotos.'] },
    { titulo: 'Cidadania Legislativa', slug: 'cidadania-legislativa', conteudo: ['Programa de aproximação entre a Câmara e a comunidade: visitas guiadas, escola do legislativo e ações educativas sobre o papel do Poder Legislativo.', 'Edite esta página no CMS com a programação atual.'] },
    { titulo: 'Ramais e Telefones', slug: 'ramais', conteudo: ['Lista de contatos e ramais dos setores da Câmara (Presidência, Diretoria Geral, Legislativo, Comunicação, Ouvidoria).', 'Edite esta página no CMS para manter os ramais atualizados.'] },
  ]
  for (const p of PAGINAS) {
    if (await existe('paginas', { slug: { equals: p.slug } })) continue
    await payload.create({
      collection: 'paginas',
      data: { titulo: p.titulo, slug: p.slug, conteudo: rt(...p.conteudo) } as never,
    })
    crPag++
  }

  // Notícias
  let dia = 17
  for (const n of NOTICIAS) {
    if (await existe('noticias', { titulo: { equals: n.titulo } })) continue
    await payload.create({
      collection: 'noticias',
      data: {
        titulo: n.titulo,
        categoria: n.categoria,
        resumo: n.resumo,
        corpo: rt(...n.corpo),
        data: `2026-06-${String(dia).padStart(2, '0')}T12:00:00.000Z`,
        publicado: true,
      } as never,
    })
    crNot++
    dia--
  }

  console.log(`Seed concluído → config: +${crCfg}, páginas: +${crPag}, notícias: +${crNot}`)
  process.exit(0)
}

await seed()
