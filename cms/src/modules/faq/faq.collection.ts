import type { CollectionConfig } from 'payload'

export const Faq: CollectionConfig = {
  slug: 'faq',
  labels: { singular: 'Pergunta FAQ', plural: 'FAQ' },
  admin: { group: 'Conteúdo', defaultColumns: ['pergunta', 'ordem'] },
  access: { read: () => true },
  fields: [
    { name: 'pergunta', type: 'text', required: true },
    { name: 'resposta', type: 'richText', label: 'Resposta' },
    { name: 'ordem', type: 'number', label: 'Ordem de exibição' },
  ],
}
