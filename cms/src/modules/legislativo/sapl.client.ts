/**
 * Cliente tipado do SAPL (fonte oficial do processo legislativo).
 * Os tipos vêm de sapl-api.d.ts, gerado do OpenAPI real do SAPL
 * (pnpm generate:sapl-types). O público nunca fala com o SAPL direto —
 * estas chamadas rodam no servidor Next e são cacheadas (ISR).
 */
import * as Sentry from '@sentry/nextjs'
import type { components } from './sapl-api'
import { camara } from '@/lib/camara.config'

type Schemas = components['schemas']

export type MateriaLegislativa = Schemas['MateriaLegislativa']
export type TipoMateriaLegislativa = Schemas['TipoMateriaLegislativa']
export type NormaJuridica = Schemas['NormaJuridica']
export type SessaoPlenaria = Schemas['SessaoPlenaria']
export type TipoSessaoPlenaria = Schemas['TipoSessaoPlenaria']
export type OrdemDia = Schemas['OrdemDia']
export type Tramitacao = Schemas['Tramitacao']
export type StatusTramitacao = Schemas['StatusTramitacao']
export type Parlamentar = Schemas['ParlamentarSerializerPublic']
export type Partido = Schemas['Partido']
export type Filiacao = Schemas['Filiacao']
export type Comissao = Schemas['Comissao']
export type Composicao = Schemas['Composicao']
export type Participacao = Schemas['Participacao']
export type CargoComissao = Schemas['CargoComissao']
export type CargoMesa = Schemas['CargoMesa']
export type ComposicaoMesa = Schemas['ComposicaoMesa']
export type AudienciaPublica = Schemas['AudienciaPublica']
export type RegistroVotacao = Schemas['RegistroVotacao']
export type VotoParlamentar = Schemas['VotoParlamentar']
export type TipoResultadoVotacao = Schemas['TipoResultadoVotacao']
export type PresencaOrdemDia = Schemas['PresencaOrdemDia']
export type Parecer = Schemas['Parecer']
export type Relatoria = Schemas['Relatoria']
export type Autoria = Schemas['Autoria']
export type Autor = Schemas['Autor']
export type NormaRelacionada = Schemas['NormaRelacionada']
export type TipoVinculoNormaJuridica = Schemas['TipoVinculoNormaJuridica']
export type OradorExpediente = Schemas['OradorExpediente']
export type OradorOrdemDia = Schemas['OradorOrdemDia']
export type DocumentoAdministrativo = Schemas['DocumentoAdministrativo']
export type Painel = Schemas['Painel']
export type Legislatura = Schemas['Legislatura']
export type Mandato = Schemas['Mandato']

/** Formato de paginação do SAPL: { pagination: {...}, results: [...] }. */
export interface SaplPaginated<T> {
  pagination?: {
    total_entries?: number
    total_pages?: number
    page?: number
    next_page?: number
    previous_page?: number
  }
  results?: T[]
}

const BASE = camara.saplBase

/** Quanto tempo (s) o cache do Next segura a resposta antes de revalidar. */
const REVALIDATE_PADRAO = 300

/** Timeout padrão em ms. Evita travar o SSR se o SAPL não responder. */
const TIMEOUT_MS = 8000

export async function saplFetch<T>(
  path: string,
  opts: { revalidate?: number } = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = process.env.SAPL_API_TOKEN
  if (token) headers['Authorization'] = `Token ${token}`

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers,
      signal: controller.signal,
      next: { revalidate: opts.revalidate ?? REVALIDATE_PADRAO },
    } as RequestInit)
    if (!res.ok) {
      const err = new Error(`SAPL respondeu ${res.status} em ${path}`)
      Sentry.captureException(err, { tags: { source: 'sapl-api', endpoint: path } })
      throw err
    }
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const timeout = new Error(`SAPL timeout em ${path}`)
      Sentry.captureException(timeout, { tags: { source: 'sapl-api', endpoint: path } })
      throw timeout
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const sapl = {
  materias: (query = '') =>
    saplFetch<SaplPaginated<MateriaLegislativa>>(`/api/materia/materialegislativa/${query}`),
  tiposMateria: (query = '') =>
    saplFetch<SaplPaginated<TipoMateriaLegislativa>>(`/api/materia/tipomaterialegislativa/${query}`),
  normas: (query = '') =>
    saplFetch<SaplPaginated<NormaJuridica>>(`/api/norma/normajuridica/${query}`),
  sessoes: (query = '') =>
    saplFetch<SaplPaginated<SessaoPlenaria>>(`/api/sessao/sessaoplenaria/${query}`),
  tiposSessao: (query = '') =>
    saplFetch<SaplPaginated<TipoSessaoPlenaria>>(`/api/sessao/tiposessaoplenaria/${query}`),
  ordemDia: (query = '', opts: { revalidate?: number } = {}) =>
    saplFetch<SaplPaginated<OrdemDia>>(`/api/sessao/ordemdia/${query}`, opts),
  tramitacoes: (query = '') =>
    saplFetch<SaplPaginated<Tramitacao>>(`/api/materia/tramitacao/${query}`),
  statusTramitacao: (query = '') =>
    saplFetch<SaplPaginated<StatusTramitacao>>(`/api/materia/statustramitacao/${query}`),
  parlamentares: (query = '') =>
    saplFetch<SaplPaginated<Parlamentar>>(`/api/parlamentares/parlamentar/${query}`),
  partidos: (query = '') =>
    saplFetch<SaplPaginated<Partido>>(`/api/parlamentares/partido/${query}`),
  filiacoes: (query = '') =>
    saplFetch<SaplPaginated<Filiacao>>(`/api/parlamentares/filiacao/${query}`),
  comissoes: (query = '') =>
    saplFetch<SaplPaginated<Comissao>>(`/api/comissoes/comissao/${query}`),
  composicoes: (query = '') =>
    saplFetch<SaplPaginated<Composicao>>(`/api/comissoes/composicao/${query}`),
  participacoes: (query = '') =>
    saplFetch<SaplPaginated<Participacao>>(`/api/comissoes/participacao/${query}`),
  cargosComissao: (query = '') =>
    saplFetch<SaplPaginated<CargoComissao>>(`/api/comissoes/cargocomissao/${query}`),
  cargosMesa: (query = '') =>
    saplFetch<SaplPaginated<CargoMesa>>(`/api/parlamentares/cargomesa/${query}`),
  composicaoMesa: (query = '') =>
    saplFetch<SaplPaginated<ComposicaoMesa>>(`/api/parlamentares/composicaomesa/${query}`),
  audiencias: (query = '') =>
    saplFetch<SaplPaginated<AudienciaPublica>>(`/api/audiencia/audienciapublica/${query}`),
  registroVotacao: (query = '') =>
    saplFetch<SaplPaginated<RegistroVotacao>>(`/api/sessao/registrovotacao/${query}`),
  votosParlamentar: (query = '') =>
    saplFetch<SaplPaginated<VotoParlamentar>>(`/api/sessao/votoparlamentar/${query}`),
  tiposResultadoVotacao: (query = '') =>
    saplFetch<SaplPaginated<TipoResultadoVotacao>>(`/api/sessao/tiporesultadovotacao/${query}`),
  presencas: (query = '', opts: { revalidate?: number } = {}) =>
    saplFetch<SaplPaginated<PresencaOrdemDia>>(`/api/sessao/presencaordemdia/${query}`, opts),
  pareceres: (query = '') =>
    saplFetch<SaplPaginated<Parecer>>(`/api/materia/parecer/${query}`),
  autorias: (query = '') =>
    saplFetch<SaplPaginated<Autoria>>(`/api/materia/autoria/${query}`),
  normasRelacionadas: (query = '') =>
    saplFetch<SaplPaginated<NormaRelacionada>>(`/api/norma/normarelacionada/${query}`),
  tiposVinculoNorma: (query = '') =>
    saplFetch<SaplPaginated<TipoVinculoNormaJuridica>>(
      `/api/norma/tipovinculonormajuridica/${query}`,
    ),
  oradoresExpediente: (query = '') =>
    saplFetch<SaplPaginated<OradorExpediente>>(`/api/sessao/oradorexpediente/${query}`),
  oradoresOrdemDia: (query = '') =>
    saplFetch<SaplPaginated<OradorOrdemDia>>(`/api/sessao/oradorordemdia/${query}`),
  documentosAdministrativos: (query = '', opts: { revalidate?: number } = {}) =>
    saplFetch<SaplPaginated<DocumentoAdministrativo>>(
      `/api/protocoloadm/documentoadministrativo/${query}`,
      opts,
    ),
  painel: (query = '', opts: { revalidate?: number } = {}) =>
    saplFetch<SaplPaginated<Painel>>(`/api/painel/painel/${query}`, opts),
  legislaturas: (query = '') =>
    saplFetch<SaplPaginated<Legislatura>>(`/api/parlamentares/legislatura/${query}`),
  mandatos: (query = '') =>
    saplFetch<SaplPaginated<Mandato>>(`/api/parlamentares/mandato/${query}`),
}
