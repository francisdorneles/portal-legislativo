'use client'

import { useRef, useState, useTransition } from 'react'
import { Sparkles, Mic, Square, Upload, Camera, Loader2 } from 'lucide-react'
import {
  estruturarDemanda,
  transcreverAudio,
  extrairRelatoDaImagem,
  type DemandaEstruturada,
} from '@/modules/ia/captura.actions'
import { criarDemanda } from '@/modules/crm/demandas.actions'
import { Panel, Field, Input, Textarea, Button } from '@/components/ui/primitives'

export function CapturaRapida() {
  const [texto, setTexto] = useState('')
  const [d, setD] = useState<DemandaEstruturada | null>(null)
  const [erro, setErro] = useState('')
  const [pending, start] = useTransition()
  const [trabalhando, setTrabalhando] = useState('') // rótulo da modalidade em curso

  // gravação
  const [gravando, setGravando] = useState(false)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioInput = useRef<HTMLInputElement>(null)
  const fotoInput = useRef<HTMLInputElement>(null)

  /** roda uma ação que devolve texto e joga no textarea (anexa se já houver conteúdo) */
  function comTexto(rotulo: string, fn: () => Promise<string>) {
    setErro('')
    setTrabalhando(rotulo)
    fn()
      .then((t) => setTexto((prev) => (prev.trim() ? `${prev.trim()}\n${t}` : t)))
      .catch(() => setErro(`Falha ao processar ${rotulo}. Verifique a IA.`))
      .finally(() => setTrabalhando(''))
  }

  function enviarAudio(blob: Blob, nome: string) {
    const fd = new FormData()
    fd.set('audio', blob, nome)
    comTexto('áudio', () => transcreverAudio(fd))
  }

  async function gravar() {
    if (gravando) {
      recRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setGravando(false)
        enviarAudio(new Blob(chunksRef.current, { type: 'audio/webm' }), 'gravacao.webm')
      }
      recRef.current = rec
      rec.start()
      setGravando(true)
    } catch {
      setErro('Não consegui acessar o microfone.')
    }
  }

  function estruturar() {
    if (!texto.trim()) return
    setErro('')
    start(async () => {
      try {
        setD(await estruturarDemanda(texto))
      } catch {
        setErro('Falha ao estruturar. Verifique a IA.')
      }
    })
  }

  const ocupado = !!trabalhando

  return (
    <div className="space-y-5">
      <Panel>
        <div className="p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Mic className="size-4 text-blue-600" /> Captura rápida
          </h2>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Fale, mande o <strong>áudio do WhatsApp</strong> ou tire uma <strong>foto</strong> (buraco, poste apagado,
            bilhete do cidadão) — a IA vira texto e estrutura numa demanda. Ou cole o relato direto abaixo.
          </p>

          {/* modalidades de entrada */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant={gravando ? 'danger' : 'ghost'} onClick={gravar} disabled={ocupado && !gravando}>
              {gravando ? <Square className="size-4" /> : <Mic className="size-4" />}
              {gravando ? 'Parar e transcrever' : 'Gravar voz'}
            </Button>
            <Button variant="ghost" onClick={() => audioInput.current?.click()} disabled={ocupado}>
              <Upload className="size-4" /> Enviar áudio
            </Button>
            <Button variant="ghost" onClick={() => fotoInput.current?.click()} disabled={ocupado}>
              <Camera className="size-4" /> Enviar foto
            </Button>
            {trabalhando && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> processando {trabalhando}…
              </span>
            )}
            <input
              ref={audioInput}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) enviarAudio(f, f.name)
                e.target.value = ''
              }}
            />
            <input
              ref={fotoInput}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  const fd = new FormData()
                  fd.set('imagem', f)
                  comTexto('foto', () => extrairRelatoDaImagem(fd))
                }
                e.target.value = ''
              }}
            />
          </div>

          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder="Ex.: o seu Zé da rua sete reclamou que tem um buraco enorme lá no centro e já furou pneu de carro…"
            className="mt-3"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={estruturar} disabled={pending || ocupado || !texto.trim()}>
              <Sparkles className="size-4" /> {pending ? 'Estruturando…' : 'Estruturar com IA'}
            </Button>
            {erro && <span className="text-sm text-destructive">{erro}</span>}
          </div>
        </div>
      </Panel>

      {d && (
        <Panel>
          <form action={criarDemanda} className="grid gap-4 p-5 sm:grid-cols-2">
            <p className="text-sm text-muted-foreground sm:col-span-2">✨ Revise o que a IA entendeu e salve:</p>
            <Field label="Título" required className="sm:col-span-2">
              <Input name="titulo" defaultValue={d.titulo} required />
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Textarea name="descricao" defaultValue={d.descricao} rows={3} />
            </Field>
            <Field label="Tema">
              <Input name="tema" defaultValue={d.tema} />
            </Field>
            <Field label="Bairro">
              <Input name="bairro" defaultValue={d.bairro} />
            </Field>
            <input type="hidden" name="status" value="ABERTA" />
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit">Criar demanda</Button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  )
}
