import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { richTextVazio } from '@/lib/richtext'

/** Renderiza conteúdo richText (lexical) do Payload. Nada se vazio. */
export function RichTextContent({ data }: { data?: SerializedEditorState | null }) {
  if (richTextVazio(data)) return null
  return <RichText data={data!} />
}
