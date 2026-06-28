import type { CollectionConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BlockquoteFeature,
  LinkFeature,
  UploadFeature,
  HorizontalRuleFeature,
  AlignFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { slugField } from '@/lib/fields/slug'

/**
 * Notícias — conteúdo editorial da Ascom (origem: CMS, ver docs/04).
 * Campos conforme docs/02. Leitura pública apenas de itens publicados.
 */
export const Noticias: CollectionConfig = {
  slug: 'noticias',
  labels: {
    singular: 'Notícia',
    plural: 'Notícias',
  },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'categoria', 'data', 'publicado'],
    group: 'Editorial',
  },
  access: {
    // Público só enxerga notícias publicadas; edição exige usuário autenticado.
    read: ({ req: { user } }) => {
      if (user) return true
      return { publicado: { equals: true } }
    },
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      required: true,
    },
    slugField('titulo'),
    {
      name: 'resumo',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'Chamada curta exibida nas listagens.',
      },
    },
    {
      name: 'corpo',
      type: 'richText',
      label: 'Conteúdo da notícia',
      editor: lexicalEditor({
        features: [
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          StrikethroughFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          BlockquoteFeature(),
          LinkFeature(),
          UploadFeature(),
          HorizontalRuleFeature(),
          AlignFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'foto',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto de capa',
      admin: {
        description: 'Imagem principal exibida no card e no topo da notícia.',
      },
    },
    {
      name: 'categoria',
      type: 'select',
      options: [
        { label: 'Sessões', value: 'sessoes' },
        { label: 'Projetos de Lei', value: 'projetos' },
        { label: 'Comunicados', value: 'comunicados' },
        { label: 'Eventos', value: 'eventos' },
        { label: 'Geral', value: 'geral' },
      ],
      defaultValue: 'geral',
    },
    {
      name: 'data',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
      },
    },
    {
      name: 'publicado',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marque para exibir no site público.',
      },
    },
  ],
}
