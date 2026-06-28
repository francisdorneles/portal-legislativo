import { FormManifestacao } from '@/modules/ouvidoria/FormManifestacao'
import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export async function generateMetadata() { return metaTitulo('Ouvidoria') }

const TEXTO_PADRAO = 'Canal para reclamações, denúncias, sugestões, elogios e solicitações, conforme a Lei nº 13.460/2017 (Código de Defesa do Usuário dos Serviços Públicos). Cada manifestação recebe um número de protocolo para acompanhamento.'

export default async function OuvidoriaPage() {
  const cfg = await obterConfigCamara()
  return (
    <ArtigoLayout titulo="Ouvidoria">
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        {cfg.textoOuvidoria ?? TEXTO_PADRAO}
      </p>
      <ul className="aviso-legal">
        <li>O prazo de resposta é de até <strong>30 dias</strong>, prorrogável por mais 30 de forma justificada.</li>
        <li>Seus dados são tratados com sigilo, nos termos da LGPD.</li>
      </ul>
      <FormManifestacao tipo="ouvidoria" comCategoria />
    </ArtigoLayout>
  )
}
