/**
 * Config de deploy — identifica QUAL câmara este processo serve e onde está o SAPL.
 * NÃO contém dados da câmara (nome, contato, etc.) — esses vêm do Payload CMS.
 *
 * Para adicionar uma câmara: criar um objeto em PERFIS e apontar CAMARA no .env.
 */

export interface CamaraConfig {
  /** Slug do cliente — chave em PERFIS e valor de env CAMARA. */
  id: string
  /** Letra/sigla para o medalhão da marca (fallback visual antes de carregar o CMS). */
  inicial: string
  /** Base da API do SAPL desta câmara. */
  saplBase: string
  /**
   * Nome curto — usado no admin (payload.config titleSuffix, BrandLogo) onde
   * chamadas async ao CMS não são possíveis. Para o site público, usar obterConfigCamara().
   */
  nomeCurto: string
}

const PERFIS: Record<string, CamaraConfig> = {
  lajeado: {
    id: 'lajeado',
    inicial: 'L',
    saplBase: process.env.SAPL_API_BASE ?? 'http://localhost:8010',
    nomeCurto: 'Câmara de Lajeado',
  },
  taquari: {
    id: 'taquari',
    inicial: 'T',
    saplBase: process.env.SAPL_API_BASE ?? 'http://localhost:8020',
    nomeCurto: 'Câmara de Taquari',
  },
}

const ATIVA = process.env.CAMARA ?? 'lajeado'

if (!PERFIS[ATIVA]) {
  throw new Error(
    `CAMARA="${ATIVA}" não tem perfil em camara.config.ts. Perfis: ${Object.keys(PERFIS).join(', ')}`,
  )
}

export const camara: CamaraConfig = PERFIS[ATIVA]
