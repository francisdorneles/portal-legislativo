/**
 * Registro central das collections do Payload, agregadas por domínio.
 * payload.config.ts consome só este barrel — cada módulo é dono do seu modelo de dados.
 */
import { Users } from './core/users.collection'
import { Media } from './core/media.collection'
import { Noticias } from './noticias/noticias.collection'
import { Paginas } from './institucional/paginas.collection'
import { Documentos } from './institucional/documentos.collection'
import { LinksUteis } from './institucional/links-uteis.collection'
import { Banners } from './banners/banners.collection'
import { Manifestacoes } from './ouvidoria/manifestacoes.collection'
import { Faq } from './faq/faq.collection'
import { AcompanhamentoMateria } from './legislativo/acompanhamento.collection'
import { Configuracoes } from './core/configuracoes.global'

export const collections = [Users, Media, Noticias, Paginas, Documentos, LinksUteis, Banners, Manifestacoes, Faq, AcompanhamentoMateria]

/** Globals do Payload (registros únicos), agregados por domínio. */
export const globals = [Configuracoes]
