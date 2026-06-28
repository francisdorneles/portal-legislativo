import { metaTitulo } from '@/lib/meta'
import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'

export async function generateMetadata() { return metaTitulo('Política de Privacidade') }

export default async function PrivacidadePage() {
  const c = await obterConfigCamara()
  const nomeOficial = c.nomeOficial || c.nomeCurto || 'A Câmara Municipal'
  return (
    <ArtigoLayout titulo="Política de Privacidade">
      <p>
        {nomeOficial} trata dados pessoais em conformidade com a Lei Geral de Proteção de
        Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2 className="sec-titulo">Quais dados coletamos</h2>
      <p>
        Coletamos apenas os dados que você informa voluntariamente nos formulários de e-SIC e
        Ouvidoria (nome, e-mail, assunto e mensagem) e cookies essenciais ao funcionamento do site.
      </p>

      <h2 className="sec-titulo">Para que usamos</h2>
      <p>
        Os dados das manifestações são usados exclusivamente para analisar e responder à sua
        solicitação, dentro dos prazos legais. Não comercializamos nem compartilhamos dados pessoais
        com terceiros, salvo obrigação legal.
      </p>

      <h2 className="sec-titulo">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelos
        canais oficiais de atendimento{c.contato.email ? ` (${c.contato.email})` : ''}.
      </p>

      <h2 className="sec-titulo">Hospedagem</h2>
      <p>Os dados são armazenados em infraestrutura nacional, conforme as boas práticas da LGPD.</p>
    </ArtigoLayout>
  )
}
