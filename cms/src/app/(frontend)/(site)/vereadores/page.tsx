import { VereadorCard } from '@/components/ui/VereadorCard'
import { listarVereadores, listarSuplentes } from '@/modules/legislativo/parlamentares.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 3600

export async function generateMetadata() { return metaTitulo('Vereadores') }

export default async function VereadoresPage() {
  const [vereadores, suplentes] = await Promise.all([listarVereadores(), listarSuplentes()])

  return (
    <>
      <h1>Vereadores</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Composição atual da Casa Legislativa.
      </p>

      {vereadores.length === 0 ? (
        <p className="vazio">Nenhum vereador cadastrado ainda.</p>
      ) : (
        <div className="grade">
          {vereadores.map((v) => (
            <VereadorCard key={v.id} vereador={v} />
          ))}
        </div>
      )}

      {suplentes.length > 0 && (
        <>
          <h2 className="sec-titulo" style={{ marginTop: '3rem' }}>Suplentes</h2>
          <p style={{ color: 'var(--cinza)', marginBottom: '1.5rem' }}>
            Candidatos eleitos na ordem de convocação.
          </p>
          <div className="grade grade--compacto">
            {suplentes.map((v) => (
              <VereadorCard key={v.id} vereador={v} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
