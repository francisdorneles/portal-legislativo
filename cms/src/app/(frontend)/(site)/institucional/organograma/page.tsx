import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export async function generateMetadata() { return metaTitulo('Organograma') }

const NIVEIS = [
  { id: 'mesa', titulo: 'Mesa Diretora / Presidência' },
  { id: 'diretoria', titulo: 'Direção / Secretaria Geral' },
  { id: 'setor', titulo: 'Setores e Coordenadorias' },
]

export default async function OrganogramaPage() {
  const cfg = await obterConfigCamara()
  const setores = cfg.organograma

  return (
    <ArtigoLayout titulo="Organograma">
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Estrutura administrativa da {cfg.nomeCurto} e competências de cada setor.
      </p>

      {setores.length === 0 ? (
        <p className="vazio">
          O organograma será exibido aqui. Cadastre os setores no admin
          (Configurações da Câmara → Organograma).
        </p>
      ) : (
        <div className="organograma">
          {NIVEIS.filter((n) => setores.some((s) => s.nivel === n.id)).map((nivel) => (
            <section key={nivel.id} className={`org-nivel org-nivel--${nivel.id}`}>
              <h2 className="org-nivel-titulo">{nivel.titulo}</h2>
              <div className="org-caixas">
                {setores
                  .filter((s) => s.nivel === nivel.id)
                  .map((s, i) => (
                    <article key={`${s.setor}-${i}`} className="org-caixa">
                      <strong>{s.setor}</strong>
                      {s.responsavel && <span className="org-resp">{s.responsavel}</span>}
                      {s.competencias && <p className="org-comp">{s.competencias}</p>}
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </ArtigoLayout>
  )
}
