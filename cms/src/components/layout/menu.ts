import type { IconName } from '@/components/ui/Icon'
import type { ConfigCamara } from '@/lib/camara'
import type { PaginaMenu } from '@/modules/institucional/paginas.queries'

export type Sub = { label: string; href: string; desc: string; icon: IconName; externo?: boolean }
export type Item = { label: string; href?: string; children?: Sub[]; alinharDireita?: boolean }

function paginasDoGrupo(paginas: PaginaMenu[], grupo: string): Sub[] {
  return paginas
    .filter((p) => p.menuGrupo === grupo)
    .map((p) => ({
      label: p.menuLabel || p.titulo,
      href: `/institucional/${p.slug}`,
      desc: p.menuDesc || '',
      icon: (p.menuIcone || 'documento') as IconName,
    }))
}

/**
 * Monta o menu principal. Estrutura fixa + páginas do CMS injetadas por grupo.
 */
export function construirMenu(cfg: ConfigCamara, paginas: PaginaMenu[] = []): Item[] {
  const ext = cfg.linksExternos

  // Processo Legislativo: tudo que acontece em plenário e nas matérias.
  // Sem Legislação aqui — ela tem menu próprio para não duplicar.
  const processo: Sub[] = [
    { label: 'Agenda', href: '/agenda', desc: 'Próximas sessões e audiências', icon: 'calendario' },
    { label: 'Projetos de Lei', href: '/processo-legislativo', desc: 'Proposições em tramitação', icon: 'documento' },
    { label: 'Sessões Plenárias', href: '/sessoes', desc: 'Pautas, atas e votações', icon: 'lista' },
    { label: 'Audiências Públicas', href: '/audiencias', desc: 'Participação da comunidade', icon: 'pessoas' },
    { label: 'Vídeos', href: '/videos', desc: 'Acervo de sessões e audiências', icon: 'arquivo' },
    { label: 'Painel Eletrônico', href: '/painel', desc: 'Acompanhe a sessão ao vivo', icon: 'lista' },
  ]
  if (ext.transmissaoAoVivo) {
    processo.push({ label: 'Transmissão ao vivo', href: ext.transmissaoAoVivo, desc: 'Assista às sessões em tempo real', icon: 'calendario', externo: true })
  }

  // Legislação: top-level próprio — cidadão que quer uma lei não sabe onde procurar.
  const legislacao: Sub[] = [
    { label: 'Leis Municipais', href: '/legislacao', desc: 'Leis, decretos e resoluções', icon: 'livro' },
    { label: 'Pesquisa LexML', href: 'https://www.lexml.gov.br', desc: 'Legislação nacional integrada', icon: 'arquivo', externo: true },
    ...paginasDoGrupo(paginas, 'legislacao'),
  ]

  // Transparência: portal interno + links externos cadastrados no admin.
  const transparencia: Sub[] = [
    { label: 'Portal da Transparência', href: '/transparencia', desc: 'Receitas, despesas e contratos', icon: 'predio' },
    ...(ext.licitacoes ? [{ label: 'Licitações', href: ext.licitacoes, desc: 'Editais e contratos', icon: 'documento' as IconName, externo: true }] : []),
    ...(ext.contasPublicas ? [{ label: 'Contas Públicas', href: ext.contasPublicas, desc: 'Prestação de contas', icon: 'predio' as IconName, externo: true }] : []),
    ...(ext.concursos ? [{ label: 'Concursos e Seleções', href: ext.concursos, desc: 'Vagas e editais', icon: 'pessoas' as IconName, externo: true }] : []),
    ...(ext.diarioOficial ? [{ label: 'Diário Oficial', href: ext.diarioOficial, desc: 'Publicações oficiais', icon: 'arquivo' as IconName, externo: true }] : []),
    ...paginasDoGrupo(paginas, 'transparencia'),
  ]

  return [
    {
      label: 'Institucional',
      children: [
        { label: 'A Câmara', href: '/institucional', desc: 'Visão geral da Casa Legislativa', icon: 'predio' },
        { label: 'Organograma', href: '/institucional/organograma', desc: 'Estrutura administrativa', icon: 'predio2' },
        { label: 'Localização e Horários', href: '/contato', desc: 'Endereço, telefones e horário', icon: 'pessoas' },
        { label: 'Documentos', href: '/documentos', desc: 'Regimento, atas, contratos e outros', icon: 'arquivo' },
        ...paginasDoGrupo(paginas, 'institucional'),
      ],
    },
    {
      label: 'Vereadores',
      children: [
        { label: 'Vereadores', href: '/vereadores', desc: 'Titulares em exercício e suplentes', icon: 'pessoas' },
        { label: 'Mesa Diretora', href: '/institucional/mesa-diretora', desc: 'Presidência e secretarias', icon: 'predio2' },
        { label: 'Comissões', href: '/comissoes', desc: 'Comissões permanentes e temporárias', icon: 'lista' },
        { label: 'Legislaturas', href: '/legislaturas', desc: 'Histórico de composição', icon: 'arquivo' },
        ...paginasDoGrupo(paginas, 'integrantes'),
      ],
    },
    { label: 'Processo Legislativo', children: processo },
    { label: 'Legislação', children: legislacao },
    { label: 'Transparência', children: transparencia },
    {
      label: 'Atendimento',
      alinharDireita: true,
      children: [
        { label: 'e-SIC', href: '/sic', desc: 'Pedidos de informação (LAI)', icon: 'balao' },
        { label: 'Ouvidoria', href: '/ouvidoria', desc: 'Reclamações e sugestões', icon: 'megafone' },
        { label: 'Fale Conosco', href: '/contato', desc: 'Endereço, telefones e horário', icon: 'pessoas' },
        { label: 'Protocolo', href: '/protocolo', desc: 'Protocolo administrativo da Casa', icon: 'arquivo' },
        { label: 'Perguntas Frequentes', href: '/faq', desc: 'Dúvidas comuns', icon: 'balao' },
        ...paginasDoGrupo(paginas, 'atendimento'),
      ],
    },
    { label: 'Notícias', href: '/noticias' },
  ]
}
