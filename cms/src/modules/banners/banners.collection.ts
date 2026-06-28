import type { CollectionConfig } from 'payload'

/** Banners da home (origem: CMS, ver docs/04). Leitura pública. */
export const Banners: CollectionConfig = {
  slug: 'banners',
  labels: { singular: 'Banner', plural: 'Banners' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'ordem', 'ativo'],
    group: 'Editorial',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      required: true,
      admin: { description: 'Identificação interna do banner.' },
    },
    { name: 'imagem', type: 'upload', relationTo: 'media', required: true },
    { name: 'link', type: 'text', admin: { description: 'URL de destino ao clicar.' } },
    {
      name: 'ordem',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Ordem no carrossel.' },
    },
    {
      name: 'ativo',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
