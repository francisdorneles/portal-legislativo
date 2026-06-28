import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { pt as ptLanguage } from './lib/pt-translations.js'
import { collections, globals } from './modules'
import { camara } from './lib/camara.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Segurança (auditoria A2 — docs/08): nunca assinar sessão com segredo vazio/fraco.
// Falha duro no boot em vez de subir com JWT forjável.
const payloadSecret = process.env.PAYLOAD_SECRET
if (!payloadSecret || payloadSecret.length < 32) {
  throw new Error(
    'PAYLOAD_SECRET ausente ou curto (mínimo 32 chars). Gere com: openssl rand -hex 32',
  )
}

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: `— ${camara.nomeCurto}`,
    },
    components: {
      graphics: {
        Logo: '@/components/admin/BrandLogo#BrandLogo',
        Icon: '@/components/admin/BrandIcon#BrandIcon',
      },
      actions: ['@/components/admin/LogoutButton#LogoutButton'],
      beforeDashboard: ['@/components/admin/AdminDashboard#AdminDashboard'],
    },
  },
  // Admin em português — a Ascom (não-técnica) edita aqui.
  i18n: {
    fallbackLanguage: 'pt',
    supportedLanguages: { pt: ptLanguage as any },
  },
  collections,
  globals,
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
})
