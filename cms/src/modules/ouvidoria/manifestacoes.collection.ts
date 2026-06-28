import type { CollectionConfig } from 'payload'

/**
 * Manifestações do cidadão: pedidos de e-SIC (LAI) e Ouvidoria.
 * Contém dados pessoais — leitura SÓ para usuários autenticados (LGPD).
 * Qualquer pessoa pode criar (envio público do formulário).
 */
export const Manifestacoes: CollectionConfig = {
  slug: 'manifestacoes',
  labels: { singular: 'Manifestação', plural: 'Manifestações' },
  admin: {
    useAsTitle: 'protocolo',
    defaultColumns: ['protocolo', 'tipo', 'assunto', 'status', 'createdAt'],
    group: 'Atendimento',
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.protocolo) {
          const ano = new Date().getFullYear()
          const seq = Math.floor(Math.random() * 900000 + 100000)
          data.protocolo = `${ano}${seq}`
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'protocolo', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      options: [
        { label: 'e-SIC (pedido de informação)', value: 'esic' },
        { label: 'Ouvidoria', value: 'ouvidoria' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'categoria',
      type: 'select',
      options: [
        { label: 'Reclamação', value: 'reclamacao' },
        { label: 'Denúncia', value: 'denuncia' },
        { label: 'Sugestão', value: 'sugestao' },
        { label: 'Elogio', value: 'elogio' },
        { label: 'Solicitação', value: 'solicitacao' },
        { label: 'Pedido de informação', value: 'informacao' },
      ],
    },
    {
      name: 'solicitanteTipo',
      type: 'select',
      label: 'Tipo de solicitante',
      defaultValue: 'fisica',
      options: [
        { label: 'Pessoa física', value: 'fisica' },
        { label: 'Pessoa jurídica', value: 'juridica' },
      ],
    },
    {
      name: 'formaResposta',
      type: 'select',
      label: 'Forma de resposta preferida',
      defaultValue: 'email',
      options: [
        { label: 'E-mail', value: 'email' },
        { label: 'Retirar na Câmara', value: 'presencial' },
        { label: 'Correspondência', value: 'correio' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'recebido',
      options: [
        { label: 'Recebido', value: 'recebido' },
        { label: 'Em andamento', value: 'andamento' },
        { label: 'Respondido', value: 'respondido' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'nome', type: 'text', label: 'Nome / Razão social', required: true, admin: { width: '60%' } },
        { name: 'documento', type: 'text', label: 'CPF / CNPJ', admin: { width: '40%', description: 'Opcional.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true, admin: { width: '60%' } },
        { name: 'telefone', type: 'text', admin: { width: '40%', description: 'Opcional.' } },
      ],
    },
    { name: 'assunto', type: 'text', required: true },
    { name: 'mensagem', type: 'textarea', required: true },
    { name: 'resposta', type: 'textarea', admin: { description: 'Resposta oficial enviada ao cidadão.' } },
  ],
}
