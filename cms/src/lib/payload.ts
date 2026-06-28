/**
 * Acesso ao Payload via Local API, centralizado.
 * Evita repetir `getPayload({ config: await config })` em cada página/query.
 */
import { getPayload } from 'payload'
import config from '@/payload.config'

export function getPayloadClient() {
  return getPayload({ config })
}
