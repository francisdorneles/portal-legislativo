import Link from 'next/link'
import { obterMesaDiretora } from '@/modules/legislativo/mesa.queries'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { ParlamentarAvatar } from '@/components/ui/ParlamentarAvatar'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 3600

export async function generateMetadata() { return metaTitulo('Mesa Diretora') }

export default async function MesaDiretoraPage() {
  const mesa = await obterMesaDiretora()

  return (
    <ArtigoLayout titulo="Mesa Diretora">
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Direção dos trabalhos legislativos no biênio.
      </p>
      {mesa.length === 0 ? (
        <p className="vazio">Mesa Diretora não cadastrada ainda.</p>
      ) : (
        <ul className="perfil-comissoes">
          {mesa.map((m) => (
            <li key={m.parlamentarId}>
              <Link href={`/vereadores/${m.parlamentarId}`} className="pc-link-com-foto">
                <ParlamentarAvatar nome={m.nome} fotoUrl={m.fotoUrl} size="sm" />
                <span>
                  <span className="pc-tipo">{m.cargo}</span>
                  <span className="pc-nome">{m.nome}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ArtigoLayout>
  )
}
