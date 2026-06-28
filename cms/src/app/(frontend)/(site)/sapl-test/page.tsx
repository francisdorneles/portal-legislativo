/**
 * Página de teste do entregável da Fase 0: "1 página consumindo o SAPL".
 * Server Component — a chamada ao SAPL acontece no servidor e é cacheada (ISR).
 * Mostra a contagem de cada recurso legislativo e prova a conexão tipada.
 */
import { sapl } from '@/modules/legislativo/sapl.client'

export const dynamic = 'force-dynamic' // no spike, sempre buscar fresco

async function contar() {
  const [materias, normas, sessoes] = await Promise.all([
    sapl.materias('?page=1'),
    sapl.normas('?page=1'),
    sapl.sessoes('?page=1'),
  ])
  return {
    materias: materias.pagination?.total_entries ?? 0,
    normas: normas.pagination?.total_entries ?? 0,
    sessoes: sessoes.pagination?.total_entries ?? 0,
    amostraMateria: materias.results?.[0] ?? null,
  }
}

export default async function SaplTestPage() {
  let dados: Awaited<ReturnType<typeof contar>> | null = null
  let erro: string | null = null
  try {
    dados = await contar()
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e)
  }

  return (
    <>
      <h1>Teste de conexão com o SAPL</h1>
      <p style={{ color: '#666' }}>
        Fonte: <code>{process.env.SAPL_API_BASE ?? 'http://localhost:8010'}</code> — cliente tipado
        gerado do OpenAPI real do SAPL.
      </p>

      {erro ? (
        <div style={{ background: '#fde8e8', padding: '1rem', borderRadius: 8 }}>
          <strong>Falha ao consultar o SAPL:</strong>
          <pre>{erro}</pre>
          <p>Confirme que o SAPL está no ar: <code>docker compose -f spike/docker-compose.yml ps</code></p>
        </div>
      ) : (
        <>
          <ul style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            <li>Matérias legislativas: <strong>{dados!.materias}</strong></li>
            <li>Normas jurídicas: <strong>{dados!.normas}</strong></li>
            <li>Sessões plenárias: <strong>{dados!.sessoes}</strong></li>
          </ul>
          <p style={{ color: '#666' }}>
            Banco do SAPL vazio (instalação nova) ⇒ contagens em 0 são esperadas. O que esta
            página prova é a <strong>conexão tipada de ponta a ponta</strong>.
          </p>
          {dados!.amostraMateria && (
            <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
              {JSON.stringify(dados!.amostraMateria, null, 2)}
            </pre>
          )}
        </>
      )}
    </>
  )
}
