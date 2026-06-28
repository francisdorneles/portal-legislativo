import Link from 'next/link'
import { metaTitulo } from '@/lib/meta'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { RichTextContent } from '@/components/ui/RichTextContent'
import { listarFaq } from '@/modules/faq/faq.queries'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export const revalidate = 3600

export async function generateMetadata() { return metaTitulo('Perguntas Frequentes') }

const PERGUNTAS_PADRAO = [
  {
    q: 'Como acompanho um projeto de lei?',
    a: (
      <>
        Acesse <Link href="/processo-legislativo">Projetos de Lei</Link>, busque pelo número ou
        assunto e abra a matéria para ver a ementa e o histórico de tramitação.
      </>
    ),
  },
  {
    q: 'Quando acontecem as sessões?',
    a: (
      <>
        A agenda fica em <Link href="/sessoes">Sessões Plenárias</Link>, com a próxima sessão em
        destaque, a pauta (Ordem do Dia) e, quando disponíveis, a ata e o vídeo.
      </>
    ),
  },
  {
    q: 'Como peço uma informação pública?',
    a: (
      <>
        Pelo <Link href="/sic">e-SIC</Link>, com base na Lei de Acesso à Informação. Você recebe um
        número de protocolo e a resposta no prazo legal — sem precisar justificar o pedido.
      </>
    ),
  },
  {
    q: 'Qual a diferença entre e-SIC e Ouvidoria?',
    a: (
      <>
        O <Link href="/sic">e-SIC</Link> é para pedir informações públicas. A{' '}
        <Link href="/ouvidoria">Ouvidoria</Link> é para reclamações, denúncias, sugestões e elogios
        sobre os serviços da Câmara.
      </>
    ),
  },
  {
    q: 'Onde encontro as leis do município?',
    a: (
      <>
        Em <Link href="/legislacao">Legislação</Link>, com busca por número ou assunto — dados
        oficiais.
      </>
    ),
  },
]

export default async function FaqPage() {
  const itens = await listarFaq()

  return (
    <ArtigoLayout titulo="Perguntas Frequentes">
      <p>Dúvidas comuns sobre o portal e os serviços da Câmara Municipal.</p>

      <div className="faq">
        {itens.length > 0
          ? itens.map((item) => (
              <details key={item.id}>
                <summary>{item.pergunta}</summary>
                <RichTextContent data={item.resposta as SerializedEditorState | null} />
              </details>
            ))
          : PERGUNTAS_PADRAO.map((p) => (
              <details key={p.q}>
                <summary>{p.q}</summary>
                <p>{p.a}</p>
              </details>
            ))}
      </div>
    </ArtigoLayout>
  )
}
