import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon, type IconName } from '@/components/ui/Icon'
import { VereadorCard } from '@/components/ui/VereadorCard'
import { VideosTransmissoes } from '@/components/ui/VideosTransmissoes'
import { AgendaFotos } from '@/components/ui/AgendaFotos'
import { formatarData } from '@/lib/format'
import { listarNoticiasPublicadas } from '@/modules/noticias/noticias.queries'
import { NoticiasDestaque } from '@/modules/noticias/NoticiasDestaque'
import { listarVereadores } from '@/modules/legislativo/parlamentares.queries'
import { obterProximaSessao, listarProximasSessoes } from '@/modules/legislativo/sessoes.queries'
import { SessoesDestaque } from '@/modules/legislativo/SessoesDestaque'
import { BuscaLegislativa } from '@/modules/legislativo/BuscaLegislativa'
import { listarBannersAtivos } from '@/modules/banners/banners.queries'
import { BannersCarrossel } from '@/modules/banners/BannersCarrossel'
import { obterConfigCamara } from '@/lib/camara'
import { obterUltimosVideos } from '@/lib/youtube'
import { mediaUrl, mediaAlt } from '@/lib/media'

export const revalidate = 300

// Itens "mais acessados" — lista curada (fallback enquanto o Umami não está
// plugado). Quando o Umami entrar, o topo vem do ranking real de acessos.
const MAIS_ACESSADOS: { href: string; titulo: string; nota: string; icon: IconName }[] = [
  { href: '/transparencia',        titulo: 'Transparência', nota: 'Mais procurado', icon: 'predio' },
  { href: '/sessoes',              titulo: 'Sessões',       nota: 'Atualizado',     icon: 'calendario' },
  { href: '/legislacao',           titulo: 'Legislação',    nota: 'Consolidada',    icon: 'livro' },
  { href: '/processo-legislativo', titulo: 'Projetos de Lei', nota: 'Em tramitação', icon: 'documento' },
  { href: '/audiencias',           titulo: 'Audiências',    nota: 'Participe',       icon: 'megafone' },
  { href: '/sic',                  titulo: 'e-SIC',         nota: 'Informação',      icon: 'balao' },
]

// Links úteis (portais oficiais externos). TODO: mover para Payload (Global
// Configurações → "Links úteis") quando o campo existir.
const LINKS_UTEIS: { href: string; titulo: string; icon: IconName }[] = [
  { href: 'https://taquari.rs.gov.br/',              titulo: 'Prefeitura',                icon: 'predio2' },
  { href: 'https://www.tjrs.jus.br/novo/',           titulo: 'Tribunal de Justiça do RS', icon: 'predio' },
  { href: 'https://www.camara.leg.br/',              titulo: 'Câmara dos Deputados',      icon: 'predio2' },
  { href: 'https://www12.senado.leg.br/hpsenado',    titulo: 'Senado Federal',            icon: 'predio' },
  { href: 'https://www.rs.gov.br/inicial',           titulo: 'Governo do RS',             icon: 'predio2' },
]

// Cards de navegação abaixo das notícias.
const NAVCARDS: { href: string; titulo: string; desc: string; icon: IconName }[] = [
  { href: '/processo-legislativo', titulo: 'Radar de Demandas', desc: 'Acompanhe as demandas da cidade', icon: 'megafone' },
  { href: '/processo-legislativo', titulo: 'Projetos de Lei',   desc: 'Propostas em tramitação na Casa', icon: 'documento' },
  { href: '/legislacao',           titulo: 'Leis Municipais',   desc: 'Toda a legislação consolidada aqui', icon: 'livro' },
]

export default async function HomePage() {
  const [noticias, sessao, camara, vereadores, banners, proximasSessoes] = await Promise.all([
    listarNoticiasPublicadas(6),
    obterProximaSessao(),
    obterConfigCamara(),
    listarVereadores(),
    listarBannersAtivos(),
    listarProximasSessoes(4),
  ])

  const videos = camara.linksExternos.transmissaoAoVivo
    ? await obterUltimosVideos(camara.linksExternos.transmissaoAoVivo, 3)
    : []

  const banner = banners[0] ?? null
  const slides = banners.map((b) => ({
    id: String(b.id),
    titulo: b.titulo,
    link: b.link ?? null,
    src: mediaUrl(b.imagem) ?? null,
    alt: mediaAlt(b.imagem, b.titulo),
  }))

  return (
    <>
      <section
        className="hero"
        style={
          camara.imagemFundoUrl
            ? {
                padding: 0,
                // Véu navy sobre a foto: preserva o contraste do texto branco (a11y).
                backgroundImage: `linear-gradient(rgba(8,31,61,0.95), rgba(13,44,84,0.95)), url(${camara.imagemFundoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { padding: 0 }
        }
      >
        <div className="wrap">
          <div>
            {/* Opção 1 — brasão visível junto ao texto */}
            <div className="hero-identidade">
              {camara.logoUrl ? (
                <img src={camara.logoUrl} alt="" aria-hidden="true" className="hero-brasao" />
              ) : (
                <span className="hero-brasao hero-brasao--inicial" aria-hidden="true">
                  {camara.inicial}
                </span>
              )}
              <span className="hero-inst">
                <span>Câmara Municipal de</span>
                <strong>{camara.nomeCurto}</strong>
              </span>
            </div>

            <h1>
              {camara.nomeCurto || 'A Câmara'} decide <u>em público</u>.
            </h1>
            <p>
              {camara.subtituloHero ?? 'Acompanhe projetos de lei, sessões, legislação e transparência num portal rápido, oficial e acessível a todos.'}
            </p>
            <div className="cta">
              <Link className="btn btn-am" href="/processo-legislativo">
                Consultar projetos
              </Link>
              <Link className="btn btn-gh" href="/sessoes">
                Assistir às sessões
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'flex-start' }}>
            {camara.taglineHero || camara.linksExternos.transmissaoAoVivo ? (
              <span className="tag">{camara.taglineHero ?? '● Transmissão ao vivo nas sessões'}</span>
            ) : null}
            <aside className="card-sessao" aria-label="Próxima sessão" style={{ width: '100%' }}>
              <div className="l">Próxima sessão</div>
              <div className="d">{sessao?.data_inicio ? formatarData(sessao.data_inicio) : 'A confirmar'}</div>
              <span style={{ color: '#bcccdf' }}>
                {sessao ? `${sessao.numero}ª ${sessao.tipoNome}` : camara.plenario}
                {sessao?.hora_inicio ? ` • ${sessao.hora_inicio}` : ''}
              </span>
              <ul>
                <li>Ordem do dia e votações</li>
                <li>Moções e requerimentos</li>
                <li>Tribuna livre</li>
              </ul>
              {sessao && (
                <Link className="btn btn-am" href={`/sessoes/${sessao.id}`} style={{ marginTop: '1rem' }}>
                  Ver pauta
                </Link>
              )}
            </aside>
          </div>
        </div>
      </section>

      <BuscaLegislativa />

      <section className="wrap" aria-labelledby="t-not">
        <SectionHeader id="t-not" titulo="Notícias" link={{ href: '/noticias', label: 'Ver todas →' }} />
        {noticias.length === 0 ? (
          <p className="vazio">Nenhuma notícia publicada ainda.</p>
        ) : (
          <NoticiasDestaque
            noticias={noticias.slice(0, 4).map((n) => ({
              id: String(n.id),
              slug: n.slug ?? '',
              titulo: n.titulo,
              categoria: n.categoria ?? null,
              publicadoEm: n.data ?? new Date().toISOString(),
              imagemUrl: mediaUrl(n.foto) ?? null,
            }))}
          />
        )}

        {/* Cards de navegação */}
        <div className="navcards">
          {NAVCARDS.map((c) => (
            <Link key={c.titulo} href={c.href} className="navcard">
              <span className="circ"><Icon name={c.icon} size={22} /></span>
              <span>
                <span className="t">{c.titulo}</span>
                <span className="s">{c.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {vereadores.length > 0 && (
        <div className="home-ver-band">
          <section className="wrap" aria-labelledby="t-ver">
            <SectionHeader id="t-ver" titulo="Conheça seus vereadores" link={{ href: '/vereadores', label: 'Ver todos →' }} />
            <div className="home-ver-grid">
              {vereadores.map((v) => (
                <VereadorCard key={v.id} vereador={v} />
              ))}
            </div>
          </section>
        </div>
      )}

      {proximasSessoes.length > 0 && (
        <section className="wrap" aria-labelledby="t-ses">
          <SessoesDestaque sessoes={proximasSessoes} />
        </section>
      )}

      {banner && (
        <section className="wrap" aria-labelledby="t-dest">
          <SectionHeader id="t-dest" titulo="Destaques" />
          <BannersCarrossel slides={slides} variante="destaque" />
        </section>
      )}

      {videos.length > 0 && (
        <section className="wrap" aria-labelledby="t-vid">
          <SectionHeader
            id="t-vid"
            titulo="Transmissões e Vídeos"
            link={
              camara.linksExternos.transmissaoAoVivo
                ? { href: camara.linksExternos.transmissaoAoVivo, label: 'Canal no YouTube →' }
                : undefined
            }
          />
          <VideosTransmissoes videos={videos} />
        </section>
      )}

      {/* Agenda — lista de eventos (esquerda) + imagem (direita) */}
      {proximasSessoes.length > 0 && (
        <section className="wrap" aria-labelledby="t-agenda">
          <SectionHeader id="t-agenda" titulo="Agenda" link={{ href: '/agenda', label: 'Ver agenda →' }} />
          <div className="agenda">
            <div className="ag-panel">
              <span className="ag-tab">Todos</span>
              {proximasSessoes.map((s) => {
                const [, mes, dia] = (s.data_inicio ?? '--').split('-')
                const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                return (
                  <Link key={s.id} href={`/sessoes/${s.id}`} className="ag-item">
                    <span className="ag-dia">
                      <span className="n">{dia ?? '--'}</span>
                      <span className="m">{mes ? MESES[Number(mes) - 1] : ''}</span>
                    </span>
                    <span>
                      <span className="ag-desc">{s.numero ? `${s.numero}ª ` : ''}{s.tipoNome}</span>
                      <span className="ag-hora">{s.hora_inicio ? `${s.hora_inicio} — ` : ''}Plenário</span>
                    </span>
                  </Link>
                )
              })}
            </div>
            <AgendaFotos fotos={camara.galeriaAgenda} />
          </div>
        </section>
      )}

      {/* Cidadania Legislativa */}
      <section className="wrap" aria-labelledby="t-cid">
        <div className="cid">
          <div className="cid-vis">
            <div className="ring">
              <div className="photo">
                {camara.imagemCidadaniaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={camara.imagemCidadaniaUrl} alt="" aria-hidden="true" />
                )}
              </div>
              <span className="badge b-sim">👍 sim</span>
              <span className="badge b-nao">👎 não</span>
              <span className="badge b-tot">Sua opinião conta</span>
            </div>
          </div>
          <div className="cid-tx">
            <h2 id="t-cid">Cidadania Legislativa</h2>
            <p>Dê sua opinião sobre assuntos em discussão na Câmara. Sua voz ajuda a construir as decisões da cidade.</p>
            <div className="status">Participe pelos canais oficiais da Câmara.</div>
            <Link className="btn btn-am" href="/ouvidoria">Fale com a Câmara</Link>
          </div>
        </div>
      </section>

      {/* Mais acessados — imagem de fundo (Payload) + atalhos (curado/Umami) */}
      <section className="mais-bg" aria-labelledby="t-mac">
        {camara.imagemMaisAcessadosUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mais-bg__img" src={camara.imagemMaisAcessadosUrl} alt="" aria-hidden="true" />
        )}
        <div className="mais-bg__veil" />
        <div className="wrap mais-bg__in">
          <div className="mais-bg__head">
            <span className="kk">Atalhos do cidadão</span>
            <h2 id="t-mac">Mais acessados</h2>
            <p>Os serviços que a população mais procura no portal.</p>
          </div>
          <div className="mais-bg__grid">
            {MAIS_ACESSADOS.map((m) => (
              <Link key={m.href} href={m.href} className="mac">
                <span className="ic"><Icon name={m.icon} size={22} /></span>
                <span className="tx"><b>{m.titulo}</b><small>{m.nota}</small></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Redes sociais */}
      {(camara.redes.facebook || camara.redes.instagram || camara.redes.youtube) && (
        <div className="redes-band">
          <section className="wrap" aria-label="Redes sociais" style={{ paddingBlock: '2.8rem' }}>
            <div className="redes-grid">
              {camara.redes.facebook && (
                <a className="rede" href={camara.redes.facebook} target="_blank" rel="noopener noreferrer">
                  <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1z"/></svg></span>
                  <span><span className="t">Facebook</span></span>
                </a>
              )}
              {camara.redes.instagram && (
                <a className="rede" href={camara.redes.instagram} target="_blank" rel="noopener noreferrer">
                  <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></span>
                  <span><span className="t">Instagram</span></span>
                </a>
              )}
              {camara.redes.youtube && (
                <a className="rede" href={camara.redes.youtube} target="_blank" rel="noopener noreferrer">
                  <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.5-.4-5a2.6 2.6 0 0 0-1.8-1.8C19.2 4.8 12 4.8 12 4.8s-7.2 0-8.8.4A2.6 2.6 0 0 0 1.4 7C1 8.5 1 12 1 12s0 3.5.4 5a2.6 2.6 0 0 0 1.8 1.8c1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4A2.6 2.6 0 0 0 22.6 17c.4-1.5.4-5 .4-5zM9.8 15.3V8.7l5.7 3.3z"/></svg></span>
                  <span><span className="t">YouTube</span></span>
                </a>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Links úteis */}
      <section className="wrap">
        <div className="lu-uteis">
          <div className="lu-lab">Links úteis</div>
          <div className="lu-row">
            {LINKS_UTEIS.map((l) => (
              <a key={l.href} className="lu-item" href={l.href} target="_blank" rel="noopener noreferrer">
                <Icon name={l.icon} size={18} />
                <span>{l.titulo}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
