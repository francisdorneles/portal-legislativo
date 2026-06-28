import React from 'react'
import {
  FileText, MessageSquare, AlertCircle, CheckCircle2,
  ExternalLink, Newspaper, ImageIcon, HelpCircle, Clock,
} from 'lucide-react'
import { getPayloadClient } from '@/lib/payload'
import { camara } from '@/lib/camara.config'

async function obterStats() {
  try {
    const payload = await getPayloadClient()
    const [noticias, manifestacoes, banners, faqs] = await Promise.all([
      payload.find({ collection: 'noticias',      limit: 0,   depth: 0, overrideAccess: true }),
      payload.find({ collection: 'manifestacoes', limit: 500, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'banners',       limit: 0,   depth: 0, overrideAccess: true }),
      payload.find({ collection: 'faq',           limit: 0,   depth: 0, overrideAccess: true }),
    ])
    const docs = manifestacoes.docs as { status?: string; tipo?: string }[]
    const pendentes = docs.filter((m) => m.status === 'recebido').length
    return {
      noticias:      noticias.totalDocs,
      manifestacoes: docs.length,
      pendentes,
      esic:          docs.filter((m) => m.tipo === 'esic').length,
      ouvidoria:     docs.filter((m) => m.tipo === 'ouvidoria').length,
      banners:       banners.totalDocs,
      faqs:          faqs.totalDocs,
    }
  } catch {
    return { noticias: 0, manifestacoes: 0, pendentes: 0, esic: 0, ouvidoria: 0, banners: 0, faqs: 0 }
  }
}

async function obterUltimasNoticias() {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'noticias', limit: 5, depth: 0, sort: '-createdAt', overrideAccess: true,
    })
    return res.docs as unknown as { id: string | number; titulo?: string; status?: string; createdAt: string }[]
  } catch {
    return []
  }
}

export async function AdminDashboard() {
  const [stats, noticias] = await Promise.all([obterStats(), obterUltimasNoticias()])

  const statCards = [
    { label: 'Notícias',    valor: stats.noticias,      desc: 'cadastradas',         icon: <Newspaper size={13} />,    href: '/admin/collections/noticias',      mod: '' },
    { label: 'Manifestações pendentes', valor: stats.pendentes, desc: `de ${stats.manifestacoes} total`, icon: <AlertCircle size={13} />, href: '/admin/collections/manifestacoes', mod: stats.pendentes > 0 ? 'adm-stat--warning' : 'adm-stat--success' },
    { label: 'e-SIC',       valor: stats.esic,          desc: 'pedidos LAI',          icon: <FileText size={13} />,     href: '/admin/collections/manifestacoes', mod: '' },
    { label: 'Ouvidoria',   valor: stats.ouvidoria,     desc: 'manifestações',        icon: <MessageSquare size={13} />,href: '/admin/collections/manifestacoes', mod: '' },
    { label: 'Banners',     valor: stats.banners,       desc: 'no carrossel',         icon: <ImageIcon size={13} />,    href: '/admin/collections/banners',       mod: '' },
    { label: 'FAQ',         valor: stats.faqs,          desc: 'perguntas',            icon: <HelpCircle size={13} />,   href: '/admin/collections/faq',           mod: '' },
  ]

  const atalhos = [
    { label: 'Nova notícia',  href: '/admin/collections/noticias/create',  icon: <Newspaper size={14} /> },
    { label: 'Novo banner',   href: '/admin/collections/banners/create',   icon: <ImageIcon size={14} /> },
    { label: 'Nova página',   href: '/admin/collections/paginas/create',   icon: <FileText size={14} /> },
    { label: 'Configurações', href: '/admin/globals/configuracoes',        icon: <CheckCircle2 size={14} /> },
  ]

  return (
    <div className="adm-dash">

      {/* Cabeçalho */}
      <div className="adm-dash__header">
        <div>
          <h2 className="adm-dash__title">{camara.nomeCurto}</h2>
          <p className="adm-dash__subtitle">Painel de conteúdo do portal</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="adm-btn-portal">
          Ver portal <ExternalLink size={12} />
        </a>
      </div>

      {/* Stat cards */}
      <div className="adm-stats">
        {statCards.map((c) => (
          <a key={c.label} href={c.href} className={`adm-stat ${c.mod}`}>
            <div className="adm-stat__label">
              {c.label}
              <span style={{ opacity: 0.6 }}>{c.icon}</span>
            </div>
            <div className="adm-stat__valor">{c.valor}</div>
            <div className="adm-stat__desc">{c.desc}</div>
          </a>
        ))}
      </div>

      {/* Alerta pendências */}
      {stats.pendentes > 0 && (
        <div className="adm-alerta">
          <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="adm-alerta__texto">
            <p className="adm-alerta__titulo">
              {stats.pendentes} manifestação{stats.pendentes > 1 ? 'ões' : ''} aguardando resposta
            </p>
            <p className="adm-alerta__sub">Prazo legal: 20 dias (e-SIC) / 30 dias (Ouvidoria)</p>
          </div>
          <a href="/admin/collections/manifestacoes" className="adm-alerta__link">
            Ver agora →
          </a>
        </div>
      )}

      {/* Últimas notícias */}
      <div className="adm-card">
        <div className="adm-card__header">
          <h3 className="adm-card__titulo">Últimas notícias</h3>
          <a href="/admin/collections/noticias/create" className="adm-card__acao">+ Nova notícia</a>
        </div>
        {noticias.length === 0 ? (
          <p className="adm-vazio">Nenhuma notícia cadastrada ainda.</p>
        ) : (
          <ul className="adm-noticias">
            {noticias.map((n) => (
              <li key={String(n.id)} className="adm-noticias__item">
                <div className="adm-noticias__esq">
                  <span className={`adm-badge ${n.status === 'published' ? 'adm-badge--pub' : 'adm-badge--rascunho'}`}>
                    {n.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </span>
                  <span className="adm-noticias__titulo">{n.titulo ?? '(sem título)'}</span>
                </div>
                <div className="adm-noticias__dir">
                  <span className="adm-noticias__data">
                    <Clock size={11} />
                    {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <a href={`/admin/collections/noticias/${n.id}`} className="adm-noticias__editar">
                    Editar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Atalhos */}
      <div className="adm-atalhos">
        {atalhos.map((a) => (
          <a key={a.href} href={a.href} className="adm-atalho">
            {a.icon}
            {a.label}
          </a>
        ))}
      </div>

    </div>
  )
}
