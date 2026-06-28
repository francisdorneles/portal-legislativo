import { listarCidadaos } from '@/modules/crm/cidadaos.queries'
import { CidadaoRow } from '@/components/CidadaoRow'
import { GridSearch } from '@/components/GridSearch'
import { Pagination } from '@/components/Pagination'
import { PageHeader, Table, Th, EmptyState, ButtonLink } from '@/components/ui/primitives'
import { Plus } from 'lucide-react'

export default async function CidadaosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page: pageRaw } = await searchParams
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1)
  const { items, total, perPage, totalPages } = await listarCidadaos({ q, page })

  return (
    <div className="p-8">
      <PageHeader
        title="Cidadãos"
        actions={
          <ButtonLink href="/dashboard/cidadaos/novo">
            <Plus className="h-4 w-4" />
            Novo cidadão
          </ButtonLink>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        {/* toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-medium tabular-nums">
            {total} <span className="font-normal text-muted-foreground">contato(s)</span>
          </span>
          <GridSearch placeholder="Buscar por nome ou bairro…" />
        </div>

        {items.length === 0 ? (
          <div className="border-t border-border p-6">
            <EmptyState
              title={q ? 'Nenhum resultado' : 'Nenhum cidadão cadastrado'}
              hint={q ? 'Ajuste a busca ou limpe o filtro.' : 'Clique em “Novo cidadão” para começar.'}
            />
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr className="border-y border-border bg-muted/50">
                  <Th>Contato</Th>
                  <Th>Bairro</Th>
                  <Th>Relacionamento</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <CidadaoRow key={c.id} c={c} />
                ))}
              </tbody>
            </Table>
            <div className="border-t border-border">
              <Pagination path="/dashboard/cidadaos" page={page} perPage={perPage} total={total} totalPages={totalPages} q={q} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
