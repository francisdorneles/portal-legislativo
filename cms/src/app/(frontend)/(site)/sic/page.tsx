import { FormManifestacao } from '@/modules/ouvidoria/FormManifestacao'
import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export async function generateMetadata() { return metaTitulo('e-SIC') }

const TEXTO_PADRAO = 'Solicite informações públicas com número de protocolo, conforme a Lei de Acesso à Informação (Lei nº 12.527/2011) e o Decreto nº 7.724/2012.'

export default async function SicPage() {
  const cfg = await obterConfigCamara()
  return (
    <ArtigoLayout titulo="e-SIC — Serviço de Informação ao Cidadão">
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        {cfg.textoSIC ?? TEXTO_PADRAO}
      </p>
      <ul className="aviso-legal">
        <li>O prazo de resposta é de até <strong>20 dias</strong>, prorrogável por mais 10 mediante justificativa.</li>
        <li>
          <strong>Você não precisa justificar</strong> o motivo do pedido (art. 10, §3º da LAI).
        </li>
        <li>Em caso de negativa, é assegurado o direito de recurso.</li>
      </ul>
      <FormManifestacao tipo="esic" comCategoria={false} />
    </ArtigoLayout>
  )
}
