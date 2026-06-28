import Link from 'next/link'
import { listarPaginas } from '@/modules/institucional/paginas.queries'
import { metaTitulo } from '@/lib/meta'
import { SectionHeader } from '@/components/ui/SectionHeader'

export const revalidate = 3600

export async function generateMetadata() { return metaTitulo('Institucional') }

export default async function InstitucionalPage() {
  const paginas = await listarPaginas()

  return (
    <>
      <h1>A Câmara Municipal</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem', marginBottom: '2rem' }}>
        Conheça a estrutura, o funcionamento e as pessoas que compõem a Casa Legislativa.
      </p>

      {paginas.length > 0 ? (
        <>
          <SectionHeader titulo="Páginas institucionais" />
          <div className="atalhos">
            {paginas.map((p) => (
              <Link className="atalho" href={`/institucional/${p.slug}`} key={p.id}>
                <h3>{p.titulo}</h3>
                {p.menuDesc && <p>{p.menuDesc}</p>}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="vazio">Nenhuma página institucional cadastrada ainda.</p>
      )}
    </>
  )
}
