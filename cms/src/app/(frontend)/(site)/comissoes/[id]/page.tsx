import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { obterComissao, listarMembros } from '@/modules/legislativo/comissoes.queries'
import { nomeCurto } from '@/lib/meta'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { ParlamentarAvatar } from '@/components/ui/ParlamentarAvatar'

export const revalidate = 3600

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const [c, sf] = await Promise.all([obterComissao(Number(id)), nomeCurto()])
  return { title: c ? `${c.nome} — ${sf}` : 'Comissão não encontrada' }
}

export default async function ComissaoPage({ params }: Params) {
  const { id } = await params
  const c = await obterComissao(Number(id))
  if (!c) notFound()

  const membros = await listarMembros(c.id)

  return (
    <ArtigoLayout
      titulo={c.nome}
      rodape={<Link href="/comissoes" className="voltar" style={{ display: 'inline-block', marginTop: '1.5rem' }}>← Comissões</Link>}
    >
      <span className="badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{c.sigla}</span>

      {c.finalidade && (
        <>
          <h2 className="sec-titulo">Finalidade</h2>
          <p>{c.finalidade}</p>
        </>
      )}

      <h2 className="sec-titulo">Composição</h2>
      {membros.length === 0 ? (
        <p className="vazio">Composição não cadastrada.</p>
      ) : (
        <ul className="perfil-comissoes">
          {membros.map((m) => (
            <li key={m.parlamentarId}>
              <Link href={`/vereadores/${m.parlamentarId}`} className="pc-link-com-foto">
                <ParlamentarAvatar nome={m.nome} fotoUrl={m.fotoUrl} size="sm" />
                <span>
                  <span className="pc-nome">{m.nome}</span>
                  <span className="pc-tipo">{m.cargo}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ArtigoLayout>
  )
}
