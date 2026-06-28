import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export async function generateMetadata() { return metaTitulo('Fale Conosco') }

export default async function ContatoPage() {
  const c = await obterConfigCamara()
  return (
    <ArtigoLayout titulo="Fale Conosco">
      <p>Canais oficiais de atendimento da {c.nomeOficial}.</p>

      <dl className="ficha">
        <div>
          <dt>Endereço</dt>
          <dd>
            {c.contato.endereco}
            {c.contato.bairro ? `, ${c.contato.bairro}` : ''} — {c.cidade}/{c.uf}
          </dd>
        </div>
        <div>
          <dt>Telefone</dt>
          <dd>{c.contato.telefone}</dd>
        </div>
        {c.contato.email && (
          <div>
            <dt>E-mail</dt>
            <dd>
              <a href={`mailto:${c.contato.email}`}>{c.contato.email}</a>
            </dd>
          </div>
        )}
        {c.contato.horario && (
          <div>
            <dt>Atendimento</dt>
            <dd>{c.contato.horario}</dd>
          </div>
        )}
      </dl>

      <p>
        Para pedidos de informação use o <a href="/sic">e-SIC</a>; para reclamações, sugestões e
        denúncias, a <a href="/ouvidoria">Ouvidoria</a>.
      </p>
    </ArtigoLayout>
  )
}
