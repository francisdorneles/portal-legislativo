import type { GlobalConfig } from 'payload'

/**
 * Cadastro da câmara — registro único editável no admin (Payload Global).
 * É a identidade que a própria equipe da câmara mantém (nome, contato, logo,
 * links de transparência) sem precisar de dev. Os defaults de bootstrap vivem
 * em `src/lib/camara.config.ts`; este global sobrepõe o que estiver preenchido.
 * Leitura pública (alimenta cabeçalho, rodapé e páginas).
 */
export const Configuracoes: GlobalConfig = {
  slug: 'configuracoes',
  label: 'Configurações da Câmara',
  access: {
    read: () => true,
    // Qualquer usuário autenticado do admin pode editar a identidade da câmara.
    // (Sem isto explícito, o botão Salvar pode não aparecer.)
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    description: 'Identidade do portal: nome, contato, logo e links de transparência.',
  },
  fields: [
    {
      name: 'camaraId',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'A qual câmara este cadastro pertence (definido no seed). Não editar.',
      },
    },
    {
      type: 'collapsible',
      label: 'Identidade',
      fields: [
        { name: 'nomeOficial', type: 'text', label: 'Nome oficial', admin: { description: 'Ex.: Câmara Municipal de Lajeado' } },
        { name: 'nomeCurto', type: 'text', label: 'Nome curto', admin: { description: 'Ex.: Câmara de Lajeado' } },
        { name: 'inicial', type: 'text', label: 'Inicial do brasão', maxLength: 2, admin: { description: 'Letra exibida no bloco da marca.' } },
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo / brasão', admin: { description: 'Se vazio, usa a inicial.' } },
        { name: 'imagemFundo', type: 'upload', relationTo: 'media', label: 'Imagem de fundo do destaque (hero)', admin: { description: 'Opcional. Aparece atrás do bloco de destaque da home, sob um véu azul que preserva a legibilidade. Se vazio, usa o fundo navy padrão.' } },
        {
          type: 'row',
          fields: [
            { name: 'cidade', type: 'text', admin: { width: '50%' } },
            { name: 'uf', type: 'text', maxLength: 2, admin: { width: '50%' } },
          ],
        },
        { name: 'plenario', type: 'text', label: 'Nome do plenário' },
      ],
    },
    {
      name: 'contato',
      type: 'group',
      label: 'Contato',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'endereco', type: 'text', label: 'Endereço', admin: { width: '70%' } },
            { name: 'bairro', type: 'text', admin: { width: '30%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'telefone', type: 'text', admin: { width: '50%' } },
            { name: 'email', type: 'email', admin: { width: '50%' } },
          ],
        },
        { name: 'horario', type: 'text', label: 'Horário de atendimento' },
      ],
    },
    {
      name: 'redes',
      type: 'group',
      label: 'Redes sociais',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'facebook', type: 'text', admin: { width: '33%' } },
            { name: 'instagram', type: 'text', admin: { width: '33%' } },
            { name: 'youtube', type: 'text', admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'linksExternos',
      type: 'group',
      label: 'Serviços e links externos (menu)',
      admin: { description: 'URLs próprias de cada câmara. Itens vazios não aparecem no menu.' },
      fields: [
        { name: 'transmissaoAoVivo', type: 'text', label: 'Transmissão ao vivo (YouTube)' },
        { name: 'licitacoes', type: 'text', label: 'Licitações' },
        { name: 'concursos', type: 'text', label: 'Concursos / Seleções' },
        { name: 'diarioOficial', type: 'text', label: 'Diário Oficial' },
        { name: 'contasPublicas', type: 'text', label: 'Contas Públicas / Prestação de contas' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Textos da home e páginas de atendimento',
      fields: [
        {
          name: 'taglineHero',
          type: 'text',
          label: 'Tag do hero (home)',
          admin: { description: 'Ex.: "● Transmissão ao vivo nas sessões". Se vazio, usa o padrão.' },
        },
        {
          name: 'subtituloHero',
          type: 'textarea',
          label: 'Parágrafo abaixo do título do hero',
          admin: { description: 'Se vazio, usa o padrão do portal.' },
        },
        {
          name: 'textoOuvidoria',
          type: 'textarea',
          label: 'Texto intro da Ouvidoria',
          admin: { description: 'Se vazio, usa o padrão.' },
        },
        {
          name: 'textoSIC',
          type: 'textarea',
          label: 'Texto intro do e-SIC',
          admin: { description: 'Se vazio, usa o padrão.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Imagens da home',
      admin: { description: 'Imagens gerenciáveis da página inicial. Vazias = degrada para um fundo neutro.' },
      fields: [
        { name: 'imagemCidadania', type: 'upload', relationTo: 'media', label: 'Imagem — Cidadania Legislativa' },
        { name: 'imagemMaisAcessados', type: 'upload', relationTo: 'media', label: 'Imagem de fundo — Mais acessados' },
        {
          name: 'galeriaAgenda',
          type: 'array',
          label: 'Galeria de fotos — Agenda',
          labels: { singular: 'Foto', plural: 'Fotos' },
          admin: { description: 'Fotos do plenário exibidas ao lado da agenda.' },
          fields: [{ name: 'imagem', type: 'upload', relationTo: 'media', required: true }],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Cores institucionais',
      admin: { description: 'Sobrescrevem as cores padrão do portal. Deixe em branco para usar o tema padrão navy/azul/amarelo.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'corPrimaria',    type: 'text', label: 'Cor primária (navy)',    admin: { width: '33%', description: 'Ex.: #081f3d' } },
            { name: 'corSecundaria',  type: 'text', label: 'Cor secundária (azul)', admin: { width: '33%', description: 'Ex.: #2a6fdb' } },
            { name: 'corDestaque',    type: 'text', label: 'Cor de destaque',       admin: { width: '33%', description: 'Ex.: #ffce3a' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'SEO e metadados',
      fields: [
        {
          name: 'siteUrl',
          type: 'text',
          label: 'URL pública do portal',
          admin: { description: 'Ex.: https://camarataquari.rs.gov.br — usada no sitemap e OG tags.' },
        },
        {
          name: 'descricaoSeo',
          type: 'textarea',
          label: 'Descrição padrão (meta description)',
          admin: { description: 'Até 160 caracteres. Aparece nos resultados de busca quando a página não tem descrição própria.' },
        },
        {
          name: 'palavrasChave',
          type: 'text',
          label: 'Palavras-chave base',
          admin: { description: 'Ex.: câmara municipal, vereadores, legislação — separadas por vírgula.' },
        },
      ],
    },
    {
      name: 'organograma',
      type: 'array',
      label: 'Organograma (estrutura administrativa)',
      labels: { singular: 'Setor', plural: 'Setores' },
      admin: { description: 'Setores da Casa, agrupados por nível. Vazio = página não aparece.' },
      fields: [
        { name: 'setor', type: 'text', label: 'Setor / órgão', required: true },
        { name: 'responsavel', type: 'text', label: 'Responsável (opcional)' },
        {
          name: 'nivel',
          type: 'select',
          label: 'Nível',
          defaultValue: 'setor',
          options: [
            { label: '1 — Mesa Diretora / Presidência', value: 'mesa' },
            { label: '2 — Direção / Secretaria Geral', value: 'diretoria' },
            { label: '3 — Setores / Coordenadorias', value: 'setor' },
          ],
        },
        { name: 'competencias', type: 'textarea', label: 'Competências (opcional)' },
      ],
    },
    {
      name: 'transparenciaLinks',
      type: 'array',
      label: 'Links de transparência',
      labels: { singular: 'Link', plural: 'Links' },
      admin: { description: 'A câmara apenas linka para os sistemas oficiais (ver docs). Agrupados por bloco na página.' },
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'href', type: 'text', label: 'URL', required: true },
        {
          name: 'categoria',
          type: 'select',
          label: 'Bloco',
          defaultValue: 'sistemas',
          options: [
            { label: 'Sistemas oficiais (geral)', value: 'sistemas' },
            { label: 'Informações funcionais (servidores, vencimentos, diárias)', value: 'funcionais' },
            { label: 'Despesas e empenhos', value: 'despesas' },
            { label: 'Demonstrativos contábeis e balanços', value: 'demonstrativos' },
            { label: 'Patrimônio (veículos, imóveis, obras)', value: 'patrimonio' },
            { label: 'Licitações e contratos', value: 'contratos' },
            { label: 'Dados abertos', value: 'dados' },
          ],
        },
      ],
    },
  ],
}
