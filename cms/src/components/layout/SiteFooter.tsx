import { obterConfigCamara } from '@/lib/camara'
import { construirMenu } from './menu'

/**
 * Rodapé do site. As colunas de navegação são DERIVADAS do mesmo `menu.ts` do
 * cabeçalho (construirMenu) — então não há manutenção em dois lugares: o que
 * entra no menu aparece no rodapé automaticamente. A 1ª coluna é a identidade
 * (nome, endereço, redes); as demais são os grupos do menu.
 */
export async function SiteFooter() {
  const camara = await obterConfigCamara()
  const menu = construirMenu(camara)

  // Grupos do menu (têm filhos) viram colunas. Itens soltos (ex.: Notícias) são
  // reunidos numa coluna "Acesso rápido".
  const grupos = menu.filter((i) => i.children?.length)
  const avulsos = menu.filter((i) => i.href && !i.children?.length)

  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>{camara.nomeCurto}</h4>
            
            {(camara.redes.facebook || camara.redes.instagram || camara.redes.youtube) && (
              <p className="redes" style={{ margin: '0.6rem 0 0' }}>
                {camara.redes.facebook && (
                  <a href={camara.redes.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                )}
                {camara.redes.instagram && (
                  <a href={camara.redes.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                )}
                {camara.redes.youtube && (
                  <a href={camara.redes.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
                )}
              </p>
            )}
            {avulsos.length > 0 && (
              <p className="redes" style={{ margin: '0.6rem 0 0' }}>
                {avulsos.map((i) => (
                  <a key={i.label} href={i.href!}>{i.label}</a>
                ))}
              </p>
            )}
          </div>

          {grupos.map((grupo) => (
            <div key={grupo.label}>
              <h4>{grupo.label}</h4>
              {grupo.children!.map((c) =>
                c.externo ? (
                  <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer">
                    {c.label} ↗
                  </a>
                ) : (
                  <a key={c.label} href={c.href}>{c.label}</a>
                ),
              )}
            </div>
          ))}
        </div>
        <div className="contato">
          <div className="contato-info">
            <div className="contato-linha">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{camara.contato.endereco}, {camara.contato.bairro} — {camara.cidade}/{camara.uf}</span>
            </div>
            {camara.contato.telefone && (
              <div className="contato-linha">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>{camara.contato.telefone}</span>
              </div>
            )}
            {camara.contato.email && (
              <div className="contato-linha">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href={`mailto:${camara.contato.email}`}>{camara.contato.email}</a>
              </div>
            )}
            {camara.contato.horario && (
              <div className="contato-linha">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{camara.contato.horario}</span>
              </div>
            )}
          </div>
        </div>
        <div className="legal">
          © {camara.ano} {camara.nomeOficial} · LAI · LGPD · Acessibilidade (eMAG/WCAG)
        </div>
      </div>
    </footer>
  )
}
