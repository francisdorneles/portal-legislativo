/**
 * Configuração efetiva da câmara em runtime = dados do Payload CMS (Global "Configurações").
 * O camara.config.ts só tem config de deploy (id, saplBase, inicial, nomeCurto para admin).
 * Use `obterConfigCamara()` em todos os componentes/páginas do site público.
 */
import { getPayloadClient } from '@/lib/payload'
import { camara, type CamaraConfig } from '@/lib/camara.config'
import type { Media } from '@/payload-types'

export interface LinkExterno {
  titulo: string
  href: string
  categoria?: string
}

export interface LinksExternos {
  transmissaoAoVivo?: string
  licitacoes?: string
  concursos?: string
  diarioOficial?: string
  contasPublicas?: string
}

export interface SetorOrganograma {
  setor: string
  responsavel?: string
  nivel: string
  competencias?: string
}

export interface ConfigCamara extends CamaraConfig {
  nomeOficial: string
  cidade: string
  uf: string
  plenario: string
  contato: {
    endereco: string
    bairro: string
    telefone: string
    email?: string
    horario?: string
  }
  transparenciaLinks: LinkExterno[]
  ano: number
  logoUrl: string | null
  imagemFundoUrl: string | null
  imagemCidadaniaUrl: string | null
  imagemMaisAcessadosUrl: string | null
  galeriaAgenda: string[]
  redes: { facebook?: string; instagram?: string; youtube?: string }
  linksExternos: LinksExternos
  organograma: SetorOrganograma[]
  taglineHero?: string
  subtituloHero?: string
  textoOuvidoria?: string
  textoSIC?: string
}

function ou<T>(adminVal: T | null | undefined, padrao: T): T {
  if (adminVal === null || adminVal === undefined) return padrao
  if (typeof adminVal === 'string' && adminVal.trim() === '') return padrao
  return adminVal
}

export async function obterConfigCamara(): Promise<ConfigCamara> {
  const base: ConfigCamara = {
    ...camara,
    nomeOficial: '',
    cidade: '',
    uf: '',
    plenario: '',
    contato: { endereco: '', bairro: '', telefone: '' },
    transparenciaLinks: [],
    ano: new Date().getFullYear(),
    logoUrl: null,
    imagemFundoUrl: null,
    imagemCidadaniaUrl: null,
    imagemMaisAcessadosUrl: null,
    galeriaAgenda: [],
    redes: {},
    linksExternos: {},
    organograma: [],
  }

  try {
    const payload = await getPayloadClient()
    const g = await payload.findGlobal({ slug: 'configuracoes', depth: 1 })

    if (g.camaraId && g.camaraId !== camara.id) return base

    const contato = g.contato ?? {}
    const redes = g.redes ?? {}
    const ext = (g.linksExternos ?? {}) as Record<string, string | null>
    const limpa = <T extends Record<string, string | null | undefined>>(o: T) =>
      Object.fromEntries(Object.entries(o).filter(([, v]) => v)) as { [K in keyof T]?: string }
    const logo = typeof g.logo === 'object' && g.logo ? (g.logo as Media) : null
    const fundo = typeof g.imagemFundo === 'object' && g.imagemFundo ? (g.imagemFundo as Media) : null
    // Campos de imagem novos (ainda não nos tipos gerados): leitura via cast.
    const gImg = g as unknown as Record<string, unknown>
    const urlMedia = (v: unknown): string | null =>
      v && typeof v === 'object' && 'url' in v ? ((v as Media).url ?? null) : null
    const galeriaAgenda = Array.isArray(gImg.galeriaAgenda)
      ? (gImg.galeriaAgenda as Array<Record<string, unknown>>)
          .map((it) => urlMedia(it?.imagem))
          .filter((u): u is string => Boolean(u))
      : []
    const links = (g.transparenciaLinks ?? [])
      .filter((l) => l?.href)
      .map((l) => ({ titulo: l.titulo, href: l.href, categoria: l.categoria ?? 'sistemas' }))
    const organograma = (g.organograma ?? [])
      .filter((s) => s?.setor)
      .map((s) => ({
        setor: s.setor,
        responsavel: s.responsavel || undefined,
        nivel: s.nivel ?? 'setor',
        competencias: s.competencias || undefined,
      }))

    const g2 = g as unknown as Record<string, string | undefined>

    return {
      ...base,
      nomeOficial: ou(g.nomeOficial, ''),
      nomeCurto: ou(g.nomeCurto, camara.nomeCurto),
      inicial: ou(g.inicial, camara.inicial),
      cidade: ou(g.cidade, ''),
      uf: ou(g.uf, ''),
      plenario: ou(g.plenario, ''),
      contato: {
        endereco: ou(contato.endereco, ''),
        bairro: ou(contato.bairro, ''),
        telefone: ou(contato.telefone, ''),
        email: contato.email || undefined,
        horario: contato.horario || undefined,
      },
      transparenciaLinks: links,
      organograma,
      logoUrl: logo?.url ?? null,
      imagemFundoUrl: fundo?.url ?? null,
      imagemCidadaniaUrl: urlMedia(gImg.imagemCidadania),
      imagemMaisAcessadosUrl: urlMedia(gImg.imagemMaisAcessados),
      galeriaAgenda,
      redes: {
        facebook: redes.facebook || undefined,
        instagram: redes.instagram || undefined,
        youtube: redes.youtube || undefined,
      },
      linksExternos: limpa({
        transmissaoAoVivo: ext.transmissaoAoVivo,
        licitacoes: ext.licitacoes,
        concursos: ext.concursos,
        diarioOficial: ext.diarioOficial,
        contasPublicas: ext.contasPublicas,
      }),
      taglineHero: g2.taglineHero || undefined,
      subtituloHero: g2.subtituloHero || undefined,
      textoOuvidoria: g2.textoOuvidoria || undefined,
      textoSIC: g2.textoSIC || undefined,
    }
  } catch {
    return base
  }
}
