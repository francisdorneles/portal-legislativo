import type { CollectionConfig } from 'payload'

/**
 * Inscrições de cidadãos para acompanhar uma matéria legislativa por e-mail.
 * Quando a tramitação avança no SAPL, o cron verifica ultimaTramitacaoId e dispara e-mail.
 * Dados pessoais — leitura só para admin (LGPD).
 */
export const AcompanhamentoMateria: CollectionConfig = {
  slug: 'acompanhamento-materia',
  labels: { singular: 'Acompanhamento', plural: 'Acompanhamentos' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'materiaId', 'ativo', 'updatedAt'],
    group: 'Atendimento',
    description: 'Cidadãos inscritos para receber alertas de tramitação de matérias.',
  },
  access: {
    create: () => true,
    read:   ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'E-mail do cidadão',
    },
    {
      name: 'materiaId',
      type: 'number',
      required: true,
      label: 'ID da matéria no SAPL',
      admin: { description: 'Identificador numérico da matéria legislativa no SAPL.' },
    },
    {
      name: 'materiaLabel',
      type: 'text',
      label: 'Descrição da matéria',
      admin: {
        readOnly: true,
        description: 'Preenchido automaticamente na inscrição (ex.: "PL 12/2025 — Ementa…").',
      },
    },
    {
      name: 'ultimaTramitacaoId',
      type: 'number',
      label: 'Última tramitação notificada',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Controle interno do cron. Não editar.',
      },
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
