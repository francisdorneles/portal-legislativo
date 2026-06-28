import type { CollectionConfig } from 'payload'

/**
 * Links úteis genéricos: portais do governo, sistemas externos, parceiros institucionais.
 * Diferente dos transparenciaLinks (que são obrigações legais), estes são curadoria livre.
 * Leitura pública. Cadastro pelo admin.
 */
export const LinksUteis: CollectionConfig = {
  slug: 'links-uteis',
  labels: { singular: 'Link útil', plural: 'Links úteis' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'categoria', 'ativo'],
    group: 'Editorial',
  },
  access: { read: () => true },
  fields: [
    { name: 'titulo', type: 'text', required: true },
    { name: 'url', type: 'text', required: true, label: 'URL' },
    {
      name: 'descricao',
      type: 'text',
      label: 'Descrição curta',
      admin: { description: 'Uma linha descrevendo o destino do link.' },
    },
    {
      name: 'categoria',
      type: 'select',
      defaultValue: 'geral',
      options: [
        { label: 'Geral', value: 'geral' },
        { label: 'Governo Municipal', value: 'municipal' },
        { label: 'Governo Estadual', value: 'estadual' },
        { label: 'Governo Federal', value: 'federal' },
        { label: 'Legislação e Normas', value: 'legislacao' },
        { label: 'Transparência e Controle', value: 'transparencia' },
        { label: 'Parceiros e Convênios', value: 'parceiros' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'ordem',
      type: 'number',
      label: 'Ordem de exibição',
      defaultValue: 99,
      admin: { position: 'sidebar' },
    },
    {
      name: 'ativo',
      type: 'checkbox',
      label: 'Ativo',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
