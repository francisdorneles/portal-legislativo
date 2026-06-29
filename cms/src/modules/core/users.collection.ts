import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  // Só usuário autenticado pode criar/ler/editar/excluir usuários. Isso impede
  // auto-cadastro pelo painel. A tela de "primeiro usuário" do Payload (quando a
  // collection está vazia) ignora este access por design — por isso o primeiro
  // admin deve ser criado de forma controlada (script/seed), fechando essa janela.
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  versions: false,
}
