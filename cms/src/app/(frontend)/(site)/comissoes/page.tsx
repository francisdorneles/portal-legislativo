import Link from 'next/link'
import { listarComissoes } from '@/modules/legislativo/comissoes.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 3600

export async function generateMetadata() { return metaTitulo('Comissões') }

export default async function ComissoesPage() {
  const comissoes = await listarComissoes()

  return (
    <>
      <h1>Comissões</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Comissões permanentes e temporárias.
      </p>
      {comissoes.length === 0 ? (
        <p className="vazio">Nenhuma comissão cadastrada ainda.</p>
      ) : (
        <div className="lista-blocos">
          {comissoes.map((c) => (
            <Link className="bloco" key={c.id} href={`/comissoes/${c.id}`}>
              <div className="bloco-head">
                <h2>{c.nome}</h2>
                <span className="badge">{c.sigla}</span>
              </div>
              {c.finalidade && <p>{c.finalidade}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
