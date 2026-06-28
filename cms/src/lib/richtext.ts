import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/**
 * Detecta rich text "vazio" — inclusive o caso em que o editor foi aberto e
 * salvo sem conteúdo (objeto lexical truthy, mas sem texto). Evita renderizar
 * um bloco vazio e alto no perfil/artigo.
 */
export function richTextVazio(data?: SerializedEditorState | null): boolean {
  const children = (data as { root?: { children?: unknown[] } } | null | undefined)?.root?.children
  if (!Array.isArray(children) || children.length === 0) return true
  // Considera vazio se não houver nenhum nó com texto não-branco.
  return !/"text"\s*:\s*"[^"]*\S[^"]*"/.test(JSON.stringify(children))
}
