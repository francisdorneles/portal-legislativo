import type { CollectionConfig } from 'payload'

/**
 * Documentos institucionais em PDF: regimento interno, lei orgânica, atas de posse, etc.
 * Leitura pública. Cadastro pelo admin.
 */
export const Documentos: CollectionConfig = {
  slug: 'documentos',
  labels: { singular: 'Documento', plural: 'Documentos' },
  admin: {
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'categoria', 'updatedAt'],
    group: 'Editorial',
  },
  access: { read: () => true },
  fields: [
    { name: 'titulo', type: 'text', required: true, label: 'Título do documento' },
    {
      name: 'categoria',
      type: 'select',
      required: true,
      defaultValue: 'institucional',
      options: [
        { label: 'Institucional', value: 'institucional' },
        { label: 'Regimento e Legislação', value: 'regimento' },
        { label: 'Atas e Resoluções', value: 'atas' },
        { label: 'Contratos e Licitações', value: 'contratos' },
        { label: 'Outros', value: 'outros' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'arquivo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Arquivo (PDF)',
    },
    {
      name: 'descricao',
      type: 'textarea',
      label: 'Descrição breve (opcional)',
      admin: { description: 'Aparece abaixo do título na listagem.' },
    },
    {
      name: 'dataDocumento',
      type: 'date',
      label: 'Data do documento',
      admin: { position: 'sidebar', description: 'Data de aprovação ou publicação.' },
    },
    {
      name: 'destaque',
      type: 'checkbox',
      label: 'Destacar na página',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
