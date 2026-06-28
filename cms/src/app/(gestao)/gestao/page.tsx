import Image from 'next/image'
import { camara } from '@/lib/camara.config'
import { obterConfigCamara } from '@/lib/camara'
import { Icon } from '@/components/ui/Icon'

export const dynamic = 'force-dynamic'

/** Central de Administração: porta única (com a marca da câmara) para as duas ferramentas. */
export default async function GestaoPage() {
  const cfg = await obterConfigCamara()
  const saplUrl = camara.saplBase

  return (
    <main className="central">
      <header className="central-marca">
        {cfg.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Image className="central-logo" src={cfg.logoUrl} alt={cfg.nomeCurto} width={56} height={56} />
        ) : (
          <span className="central-inicial" aria-hidden="true">{cfg.inicial}</span>
        )}
        <div>
          <p className="central-eyebrow">Central de Administração</p>
          <h1>{cfg.nomeOficial}</h1>
        </div>
      </header>

      <p className="central-intro">Escolha o sistema que você quer administrar.</p>

      <div className="central-portas">
        <a className="central-porta" href={saplUrl} target="_blank" rel="noopener noreferrer">
          <span className="central-ic" aria-hidden="true"><Icon name="documento" size={28} /></span>
          <h2>Processo Legislativo</h2>
          <p>Vereadores, matérias, tramitação, sessões, comissões e audiências. <strong>SAPL ↗</strong></p>
        </a>

        <a className="central-porta" href="/admin">
          <span className="central-ic" aria-hidden="true"><Icon name="arquivo" size={28} /></span>
          <h2>Conteúdo do Site</h2>
          <p>Notícias, banners, páginas, configurações da câmara e ouvidoria. <strong>Painel</strong></p>
        </a>
      </div>

      <p className="central-rodape">
        Dúvida sobre qual usar? Dados legislativos ficam no SAPL; conteúdo e identidade do site, no Painel.
      </p>
    </main>
  )
}
