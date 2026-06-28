import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { listarDemandas } from '@/modules/crm/demandas.queries'
import { DemandaRow } from '@/components/DemandaRow'
import { GridSearch } from '@/components/GridSearch'
import { Pagination } from '@/components/Pagination'
import { PageHeader, Table, Th, EmptyState, ButtonLink } from '@/components/ui/primitives'

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { q = '', page: pageRaw } = await searchParams
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1)
  const { items, total, perPage, totalPages } = await listarDemandas({ q, page })

  return (
    <div className="p-8">
      <PageHeader
        title="Demandas"
        actions={
          <ButtonLink href="/dashboard/demandas/novo">
            <Plus className="h-4 w-4" />
            Nova demanda
          </ButtonLink>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-medium tabular-nums">
            {total} <span className="font-normal text-muted-foreground">demanda(s)</span>
          </span>
          <GridSearch placeholder="Buscar por título, tema ou bairro…" />
        </div>

        {items.length === 0 ? (
          <div className="border-t border-border p-6">
            <EmptyState
              title={q ? 'Nenhum resultado' : 'Nenhuma demanda ainda'}
              hint={q ? 'Ajuste a busca ou limpe o filtro.' : 'Clique em “Nova demanda” para registrar a primeira.'}
            />
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr className="border-y border-border bg-muted/50">
                  <Th>Demanda</Th>
                  <Th>Bairro</Th>
                  <Th>Cidadão</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <DemandaRow key={d.id} d={d} />
                ))}
              </tbody>
            </Table>
            <div className="border-t border-border">
              <Pagination path="/dashboard/demandas" page={page} perPage={perPage} total={total} totalPages={totalPages} q={q} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
