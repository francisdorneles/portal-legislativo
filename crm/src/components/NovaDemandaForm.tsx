import { listarCidadaosParaSelect } from '@/modules/crm/demandas.queries'
import { criarDemanda } from '@/modules/crm/demandas.actions'
import { listarBairrosConhecidos } from '@/modules/radar/radar.ui'
import { Panel, Field, Input, Select, Textarea, Button } from '@/components/ui/primitives'

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENCAMINHADA: 'Encaminhada',
  RESOLVIDA: 'Resolvida',
}

export async function NovaDemandaForm() {
  const [cidadaos, bairros] = await Promise.all([listarCidadaosParaSelect(), listarBairrosConhecidos()])
  return (
    <Panel>
      <form action={criarDemanda} className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Título" required className="sm:col-span-2">
          <Input name="titulo" placeholder="Resumo da demanda" required />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Textarea name="descricao" placeholder="Detalhes, contexto, endereço…" rows={3} />
        </Field>
        <Field label="Tema">
          <Input name="tema" placeholder="saúde, asfalto, iluminação…" />
        </Field>
        <Field label="Bairro" hint="Bairros do Radar — padroniza o cruzamento voto×demanda.">
          <Select name="bairro" defaultValue="">
            <option value="">— selecione o bairro —</option>
            {bairros.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cidadão">
          <Select name="cidadaoId" defaultValue="">
            <option value="">— sem cidadão —</option>
            {cidadaos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="ABERTA">
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit">Cadastrar demanda</Button>
        </div>
      </form>
    </Panel>
  )
}
