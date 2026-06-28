/**
 * Provedores de IA atrás de uma interface única (agnóstico). Cada um implementa embed/gerar.
 *   - stub:   determinístico, offline (testes/PoC e fallback)
 *   - ollama: local (OpenAI-compatible em /api) — privacidade total
 *   - openai: API de fronteira (formato OpenAI-compatible) — qualidade máxima
 */
import { createHash } from 'node:crypto'
import { DIM, iaConfig } from './config.js'

export type GerarOpts = { sistema?: string; prompt: string; temperatura?: number; maxTokens?: number }

/* ---------------- stub (offline, determinístico) ---------------- */
function embedStub(texto: string): number[] {
  // vetor determinístico a partir do hash do texto (suficiente p/ testar isolamento/pipeline)
  const v = new Array<number>(DIM)
  let h = createHash('sha256').update(texto).digest()
  for (let i = 0; i < DIM; i++) {
    if (i % 32 === 0) h = createHash('sha256').update(h).digest()
    v[i] = (h[i % 32] / 255) * 2 - 1
  }
  // normaliza (cosine-friendly)
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / norm)
}

/* ---------------- ollama (local) ---------------- */
async function embedOllama(textos: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (const t of textos) {
    const r = await fetch(`${iaConfig.ollama.url}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: iaConfig.ollama.embedModel, prompt: t }),
    })
    if (!r.ok) throw new Error(`ollama embed ${r.status}`)
    const j = (await r.json()) as { embedding: number[] }
    out.push(j.embedding)
  }
  return out
}
async function gerarOllama(o: GerarOpts): Promise<string> {
  const r = await fetch(`${iaConfig.ollama.url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: iaConfig.ollama.genModel,
      stream: false,
      options: { temperature: o.temperatura ?? 0.2 },
      messages: [
        ...(o.sistema ? [{ role: 'system', content: o.sistema }] : []),
        { role: 'user', content: o.prompt },
      ],
    }),
  })
  if (!r.ok) throw new Error(`ollama gen ${r.status}`)
  const j = (await r.json()) as { message: { content: string } }
  return j.message.content
}

/* ---------------- openai-compatible (fronteira) ---------------- */
async function embedOpenAI(textos: string[]): Promise<number[][]> {
  const { url, key, embedModel } = iaConfig.openai
  const r = await fetch(`${url}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    // dimensions: força 1024 (text-embedding-3-*) p/ casar a coluna pgvector e o Ollama
    body: JSON.stringify({ model: embedModel, input: textos, dimensions: DIM }),
  })
  if (!r.ok) throw new Error(`openai embed ${r.status}`)
  const j = (await r.json()) as { data: { embedding: number[] }[] }
  return j.data.map((d) => d.embedding)
}
async function gerarOpenAI(o: GerarOpts): Promise<string> {
  const { url, key, model } = iaConfig.fronteira
  const r = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: o.temperatura ?? 0.2,
      max_tokens: o.maxTokens,
      messages: [
        ...(o.sistema ? [{ role: 'system', content: o.sistema }] : []),
        { role: 'user', content: o.prompt },
      ],
    }),
  })
  if (!r.ok) throw new Error(`openai gen ${r.status}`)
  const j = (await r.json()) as { choices: { message: { content: string } }[] }
  return j.choices[0].message.content
}

/* ---------------- transcrição (áudio → texto, Whisper) ---------------- */
/** Transcreve áudio via API OpenAI-compatible (/audio/transcriptions). pt-BR. */
export async function transcrever(audio: Blob, filename: string): Promise<string> {
  const { url, key, transcribeModel } = iaConfig.openai
  if (!key) throw new Error('transcrição requer IA_OPENAI_KEY (Whisper)')
  const fd = new FormData()
  fd.set('file', audio, filename)
  fd.set('model', transcribeModel)
  fd.set('language', 'pt')
  const r = await fetch(`${url}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  })
  if (!r.ok) throw new Error(`transcrição ${r.status}`)
  const j = (await r.json()) as { text: string }
  return j.text.trim()
}

/* ---------------- visão (foto → relato) ---------------- */
/** Lê uma imagem (data URL) e devolve um relato textual conforme `instrucao`. */
export async function lerImagem(dataUrl: string, instrucao: string): Promise<string> {
  // usa a infra de fronteira (chat/completions multimodal); modelo de visão override-ável
  const { url, key, model } = iaConfig.fronteira
  if (!key) throw new Error('leitura de foto requer IA_FRONTIER_KEY (modelo com visão)')
  const r = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: iaConfig.visionModel || model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: instrucao },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })
  if (!r.ok) throw new Error(`visão ${r.status}`)
  const j = (await r.json()) as { choices: { message: { content: string } }[] }
  return j.choices[0].message.content.trim()
}

/* ---------------- dispatch ---------------- */
export async function embed(textos: string[]): Promise<number[][]> {
  switch (iaConfig.embedProvider) {
    case 'ollama':
      return embedOllama(textos)
    case 'openai':
      return embedOpenAI(textos)
    default:
      return textos.map(embedStub)
  }
}

export async function gerar(provider: 'stub' | 'ollama' | 'openai', o: GerarOpts): Promise<string> {
  switch (provider) {
    case 'ollama':
      return gerarOllama(o)
    case 'openai':
      return gerarOpenAI(o)
    default:
      return `[stub] ${o.prompt.slice(0, 120)}` // eco — só p/ pipeline offline
  }
}
