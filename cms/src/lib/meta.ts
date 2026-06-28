import { obterConfigCamara } from './camara'

/** Retorna `{ title: "Página — Nome da Câmara" }` para usar em generateMetadata(). */
export async function metaTitulo(pagina: string) {
  const c = await obterConfigCamara()
  const sufixo = c.nomeCurto || 'Portal Legislativo'
  return { title: `${pagina} — ${sufixo}` }
}

/** Apenas o sufixo — útil em generateMetadata() dinâmico que já busca outro dado. */
export async function nomeCurto(): Promise<string> {
  const c = await obterConfigCamara()
  return c.nomeCurto || 'Portal Legislativo'
}
