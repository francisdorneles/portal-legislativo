import { NoticiaCard } from '@/components/ui/NoticiaCard'
import { listarNoticiasPublicadas } from '@/modules/noticias/noticias.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Notícias') }

export default async function NoticiasPage() {
  const noticias = await listarNoticiasPublicadas(20)

  return (
    <>
      <h1>Notícias</h1>
      {noticias.length === 0 ? (
        <p className="vazio">
          Nenhuma notícia publicada ainda. Crie uma em <code>/admin</code> (collection Notícias) e
          marque <strong>Publicado</strong>.
        </p>
      ) : (
        <div className="noticias">
          {noticias.map((n) => (
            <NoticiaCard key={n.id} noticia={n} />
          ))}
        </div>
      )}
    </>
  )
}
