import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { buscarCidadao, listarSugestoesTags } from '@/modules/crm/cidadaos.queries'
import { editarCidadao, excluirCidadao } from '@/modules/crm/cidadaos.actions'
import { TagInput } from '@/components/TagInput'
import { Panel, Field, Input, Select, Button } from '@/components/ui/primitives'

export default async function EditarCidadaoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const [cidadao, sugestoes] = await Promise.all([buscarCidadao(id), listarSugestoesTags()])
  if (!cidadao) notFound()

  const salvar = editarCidadao.bind(null, id)

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard/cidadaos" className="text-sm text-slate-500 hover:text-slate-900 hover:underline">
        ← Cidadãos
      </Link>
      <h1 className="mb-6 mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900">Editar cidadão</h1>

      <Panel>
        <form action={salvar} className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nome" required className="sm:col-span-2">
            <Input name="nome" defaultValue={cidadao.nome} required />
          </Field>
          <Field label="Telefone">
            <Input name="telefone" defaultValue={cidadao.telefone ?? ''} placeholder="(51) 9 9999-9999" />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" defaultValue={cidadao.email ?? ''} placeholder="email@exemplo.com" />
          </Field>
          <Field label="Bairro">
            <Input name="bairro" defaultValue={cidadao.bairro ?? ''} placeholder="Bairro" />
          </Field>
          <Field label="Nascimento">
            <Input name="nascimento" type="date" defaultValue={cidadao.nascimento ? cidadao.nascimento.toISOString().slice(0, 10) : ''} />
          </Field>
          <Field label="Tags" className="sm:col-span-2">
            <TagInput sugestoes={sugestoes} iniciais={cidadao.tags} />
          </Field>
          <Field label="Tipo de contato">
            <Select name="tipoContato" defaultValue={cidadao.tipoContato}>
              <option value="CIDADAO">Cidadão</option>
              <option value="LIDERANCA">Liderança</option>
            </Select>
          </Field>
          <Field label="Tipo de liderança" hint="Preencha apenas se for liderança.">
            <Input name="tipoLideranca" defaultValue={cidadao.tipoLideranca ?? ''} placeholder="ex.: comunitária…" />
          </Field>
          <Field label="Região de influência" hint="Preencha apenas se for liderança.">
            <Input name="regiaoInfluencia" defaultValue={cidadao.regiaoInfluencia ?? ''} placeholder="ex.: Centro…" />
          </Field>
          <Field label="Influência (1–5)" hint="Preencha apenas se for liderança.">
            <Input name="influencia" type="number" min={1} max={5} defaultValue={cidadao.influencia ?? ''} placeholder="1 a 5" />
          </Field>
          <div className="mt-1 flex items-center justify-between sm:col-span-2">
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </Panel>

      <form action={excluirCidadao.bind(null, id)} className="mt-4">
        <Button variant="danger" type="submit">Excluir cidadão</Button>
      </form>
    </div>
  )
}
