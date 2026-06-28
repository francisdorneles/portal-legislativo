import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Arquivo de mídia', plural: 'Biblioteca de mídia' },
  admin: {
    group: 'Editorial',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Texto alternativo (acessibilidade)',
    },
  ],
  upload: true,
}
