import type { CollectionConfig } from 'payload'

/** Usuário é admin? Lê o papel salvo no JWT (saveToJWT no campo `role`). */
const isAdmin = (user: { role?: string } | null | undefined): boolean => user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // Acesso ao painel: qualquer usuário autenticado.
    admin: ({ req: { user } }) => Boolean(user),
    // Criar/excluir usuários: só admin. (A tela de "primeiro usuário" do Payload,
    // quando a collection está vazia, ignora isto por design — por isso o primeiro
    // admin é criado de forma controlada via script, fechando essa janela.)
    create: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
    // Editar: admin edita qualquer um; usuário comum só a própria conta (senha etc.).
    update: ({ req: { user }, id }) => isAdmin(user) || user?.id === id,
    // Ler: admin vê todos; usuário comum só a si mesmo.
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user) return { id: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true, // disponível em req.user.role para o access control
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        // Só admin define/altera o papel — impede um editor se autopromover a admin.
        create: ({ req: { user } }) => isAdmin(user),
        update: ({ req: { user } }) => isAdmin(user),
      },
    },
  ],
  versions: false,
}
