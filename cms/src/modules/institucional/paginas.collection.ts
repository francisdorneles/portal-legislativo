import type { CollectionConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
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
 * Páginas institucionais de conteúdo livre (história, estrutura, mesa diretora).
 * Origem: CMS (ver docs/04). Leitura pública.
 */
export const Paginas: CollectionConfig = {
  slug: 'paginas',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'slug'],
    group: 'Editorial',
  },
  access: { read: () => true },
  fields: [
    { name: 'titulo', type: 'text', required: true },
    slugField('titulo'),
    {
      type: 'collapsible',
      label: 'Vínculo com menu',
      admin: { description: 'Se preenchido, esta página aparece automaticamente no menu principal.' },
      fields: [
        {
          name: 'menuGrupo',
          type: 'select',
          label: 'Grupo do menu',
          options: [
            { label: '— Não aparece no menu —', value: '' },
            { label: 'Institucional', value: 'institucional' },
            { label: 'Vereadores', value: 'integrantes' },
            { label: 'Processo Legislativo', value: 'atividade' },
            { label: 'Legislação', value: 'legislacao' },
            { label: 'Transparência', value: 'transparencia' },
            { label: 'Atendimento', value: 'atendimento' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'menuLabel', type: 'text', label: 'Rótulo no menu', admin: { width: '50%', description: 'Se vazio, usa o título da página.' } },
            { name: 'menuDesc', type: 'text', label: 'Descrição no submenu', admin: { width: '50%' } },
          ],
        },
        {
          name: 'menuIcone',
          type: 'select',
          label: 'Ícone',
          options: [
            { label: 'Documento', value: 'documento' },
            { label: 'Arquivo / Pasta', value: 'arquivo' },
            { label: 'Calendário', value: 'calendario' },
            { label: 'Pessoas', value: 'pessoas' },
            { label: 'Lista', value: 'lista' },
            { label: 'Prédio', value: 'predio' },
            { label: 'Prédio 2', value: 'predio2' },
            { label: 'Livro', value: 'livro' },
            { label: 'Megafone', value: 'megafone' },
            { label: 'Balão', value: 'balao' },
          ],
          defaultValue: 'documento',
        },
      ],
    },
    {
      name: 'conteudo',
      type: 'richText',
      label: 'Conteúdo',
      editor: lexicalEditor({
        features: [
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
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
  ],
}
