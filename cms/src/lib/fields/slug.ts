import type { Field } from 'payload'

const ACENTOS = /[̀-ͯ]/g

/** Converte texto em slug: minúsculas, sem acentos, hifenizado. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Campo slug reutilizável. Gera automaticamente a partir de `source`
 * (ex.: 'titulo' ou 'nome') quando vazio; normaliza se preenchido à mão.
 * O editor pode sobrescrever no admin.
 */
export function slugField(source = 'titulo'): Field {
  return {
    name: 'slug',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: `Gerado automaticamente a partir de "${source}". Edite apenas se necessário.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.length > 0) return slugify(value)
          const src = data?.[source]
          if (typeof src === 'string' && src.length > 0) return slugify(src)
          return value
        },
      ],
    },
  }
}
