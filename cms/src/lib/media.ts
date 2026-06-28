import type { Media } from '@/payload-types'

/** URL de um campo de upload do Payload (relationship → Media). Null se ausente. */
export function mediaUrl(value?: number | Media | null): string | null {
  if (!value || typeof value === 'number') return null
  return value.url ?? null
}

/** Texto alternativo de uma mídia, com fallback. */
export function mediaAlt(value?: number | Media | null, fallback = ''): string {
  if (!value || typeof value === 'number') return fallback
  return value.alt ?? fallback
}
