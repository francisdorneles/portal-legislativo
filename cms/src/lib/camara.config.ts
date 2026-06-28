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
  /** Nome oficial completo da câmara — usado no seed e em fallbacks do site. */
  nomeOficial: string
  cidade: string
  uf: string
  plenario: string
  ano: number
  redes: {
    facebook?: string
    instagram?: string
    youtube?: string
  }
  contato: {
    endereco: string
    bairro: string
    telefone: string
    email: string
    horario: string
  }
}

const PERFIS: Record<string, CamaraConfig> = {
  lajeado: {
    id: 'lajeado',
    inicial: 'L',
    saplBase: process.env.SAPL_API_BASE ?? 'http://localhost:8010',
    nomeCurto: 'Câmara de Lajeado',
    nomeOficial: 'Câmara Municipal de Lajeado',
    cidade: 'Lajeado',
    uf: 'RS',
    plenario: 'Plenário Vereador Darcy Pozzobon',
    ano: new Date().getFullYear(),
    redes: {},
    contato: {
      endereco: 'Rua Senador Pinheiro Machado, 1.001',
      bairro: 'Centro',
      telefone: '(51) 3714-3400',
      email: 'camara@camaralajeado.rs.gov.br',
      horario: 'Segunda a sexta, das 8h às 17h',
    },
  },
  taquari: {
    id: 'taquari',
    inicial: 'T',
    saplBase: process.env.SAPL_API_BASE ?? 'http://localhost:8020',
    nomeCurto: 'Câmara de Taquari',
    nomeOficial: 'Câmara Municipal de Taquari',
    cidade: 'Taquari',
    uf: 'RS',
    plenario: 'Plenário da Câmara Municipal de Taquari',
    ano: new Date().getFullYear(),
    redes: {},
    contato: {
      endereco: 'Rua Marechal Floriano, 530',
      bairro: 'Centro',
      telefone: '(51) 3652-1414',
      email: 'camara@camarataquari.rs.gov.br',
      horario: 'Segunda a sexta, das 8h às 17h',
    },
  },
}

const ATIVA = process.env.CAMARA ?? 'lajeado'

if (!PERFIS[ATIVA]) {
  throw new Error(
    `CAMARA="${ATIVA}" não tem perfil em camara.config.ts. Perfis: ${Object.keys(PERFIS).join(', ')}`,
  )
}

export const camara: CamaraConfig = PERFIS[ATIVA]
