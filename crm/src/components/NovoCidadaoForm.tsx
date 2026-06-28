import { criarCidadao } from '@/modules/crm/cidadaos.actions'
import { listarSugestoesTags } from '@/modules/crm/cidadaos.queries'
import { TagInput } from '@/components/TagInput'
import { Panel, Field, Input, Select, Button } from '@/components/ui/primitives'

export async function NovoCidadaoForm() {
  const sugestoes = await listarSugestoesTags()
  return (
    <Panel>
      <form action={criarCidadao} className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Nome" required className="sm:col-span-2">
          <Input name="nome" placeholder="Nome completo" required />
        </Field>
        <Field label="Telefone">
          <Input name="telefone" placeholder="(51) 9 9999-9999" />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" placeholder="email@exemplo.com" />
        </Field>
        <Field label="Bairro">
          <Input name="bairro" placeholder="Bairro" />
        </Field>
        <Field label="Nascimento">
          <Input name="nascimento" type="date" />
        </Field>
        <Field label="Tags" className="sm:col-span-2" hint="Reaproveite tags já usadas para padronizar o vocabulário.">
          <TagInput sugestoes={sugestoes} />
        </Field>
        <Field label="Tipo de contato">
          <Select name="tipoContato" defaultValue="CIDADAO">
            <option value="CIDADAO">Cidadão</option>
            <option value="LIDERANCA">Liderança</option>
          </Select>
        </Field>
        <Field label="Tipo de liderança" hint="Preencha apenas se for liderança.">
          <Input name="tipoLideranca" placeholder="ex.: comunitária, religiosa…" />
        </Field>
        <Field label="Região de influência" hint="Preencha apenas se for liderança.">
          <Input name="regiaoInfluencia" placeholder="ex.: Centro, zona rural…" />
        </Field>
        <Field label="Influência (1–5)" hint="Preencha apenas se for liderança.">
          <Input name="influencia" type="number" min={1} max={5} placeholder="1 a 5" />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit">Cadastrar contato</Button>
        </div>
      </form>
    </Panel>
  )
}
