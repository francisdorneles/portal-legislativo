'use server'

/**
 * Captura inteligente — texto livre (relato de rua / WhatsApp) → demanda ESTRUTURADA.
 * É o núcleo do motor de retenção; voz (Whisper) e foto (Vision) alimentam o mesmo `texto`.
 * Roda no tier local (extração barata). Não grava nada — devolve a estrutura pra revisão.
 */
import { auth } from '@/auth'
import { gerar, transcrever, lerImagem } from './gateway'

export type DemandaEstruturada = {
  titulo: string
  descricao: string
  tema: string
  bairro: string
}

const SISTEMA = `Você extrai, de um relato informal de cidadão, os campos de uma DEMANDA de gabinete.
Responda APENAS um JSON válido (sem markdown, sem texto fora) com as chaves:
- "titulo": resumo curto e objetivo (máx. 8 palavras)
- "descricao": o relato reescrito claro e formal
- "tema": UMA palavra entre saúde, asfalto, iluminação, limpeza, segurança, saneamento, educação, transporte, outros
- "bairro": o bairro citado, ou "" se não houver
Não invente dados que não estejam no relato.`

function parseJson(s: string): DemandaEstruturada {
  const limpo = s.replace(/```json|```/g, '').trim()
  const ini = limpo.indexOf('{')
  const fim = limpo.lastIndexOf('}')
  const json = ini >= 0 && fim >= 0 ? limpo.slice(ini, fim + 1) : limpo
  const o = JSON.parse(json) as Partial<DemandaEstruturada>
  return {
    titulo: String(o.titulo ?? '').trim(),
    descricao: String(o.descricao ?? '').trim(),
    tema: String(o.tema ?? '').trim().toLowerCase(),
    bairro: String(o.bairro ?? '').trim(),
  }
}

export async function estruturarDemanda(texto: string): Promise<DemandaEstruturada> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const t = texto.trim()
  if (!t) throw new Error('texto vazio')
  const r = await gerar({ tier: 'local', sistema: SISTEMA, prompt: t, temperatura: 0 })
  return parseJson(r)
}

/**
 * Voz → texto (Whisper). Recebe o áudio gravado/enviado e devolve a transcrição, que alimenta
 * o mesmo fluxo de `estruturarDemanda`. Não grava nada.
 */
export async function transcreverAudio(fd: FormData): Promise<string> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const audio = fd.get('audio')
  if (!(audio instanceof Blob) || audio.size === 0) throw new Error('áudio vazio')
  const nome = (audio as File).name || 'audio.webm'
  return transcrever(audio, nome)
}

const VISAO = `Você recebe uma FOTO tirada por um assessor de gabinete na rua (ex.: buraco na via,
poste apagado, lixo acumulado, bilhete escrito à mão de um cidadão). Descreva, em português, o
PROBLEMA que a foto registra como um relato objetivo que vire uma demanda. Se houver texto escrito
na imagem, transcreva-o. Não invente localização nem dados que não estejam visíveis.`

/**
 * Foto → relato (Vision). Recebe a imagem, devolve um relato textual que alimenta o mesmo fluxo
 * de `estruturarDemanda`. Não grava nada.
 */
export async function extrairRelatoDaImagem(fd: FormData): Promise<string> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const img = fd.get('imagem')
  if (!(img instanceof Blob) || img.size === 0) throw new Error('imagem vazia')
  const buf = Buffer.from(await img.arrayBuffer())
  const mime = img.type || 'image/jpeg'
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
  return lerImagem(dataUrl, VISAO)
}
