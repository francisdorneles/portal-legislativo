/**
 * PoC Captura multimodal — valida AO VIVO os providers de voz (Whisper) e foto (Visão).
 *   • Voz: gera um áudio com TTS da OpenAI e transcreve de volta (round-trip do Whisper).
 *   • Foto: baixa uma imagem real de buraco na via e extrai o relato (Visão).
 * Cada resultado é então estruturado em demanda (gateway tier local) pra provar o fluxo todo.
 *
 * Precisa de rede + IA_OPENAI_KEY / IA_FRONTIER_KEY no .env. Roda: pnpm poc:captura
 */
import { readFileSync } from 'node:fs'
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(IA_[A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

const SISTEMA = `Extraia de um relato informal os campos de uma DEMANDA. Responda só JSON com
chaves titulo, descricao, tema (uma palavra), bairro. Não invente dados.`

async function main() {
  const { transcrever, lerImagem, gerar } = await import('../src/modules/ia/gateway.js')
  const check = (n: string, ok: boolean) => { console.log(`${ok ? '✅' : '❌'} ${n}`); if (!ok) process.exitCode = 1 }

  const url = process.env.IA_OPENAI_URL ?? 'https://api.openai.com/v1'
  const key = process.env.IA_OPENAI_KEY ?? ''

  // ---------- VOZ: TTS → Whisper ----------
  const frase = 'Tem um buraco enorme na rua sete de setembro aqui no bairro Centro e já furou pneu de carro.'
  const tts = await fetch(`${url}/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'tts-1', voice: 'onyx', input: frase, response_format: 'mp3' }),
  })
  check('0. TTS gerou o áudio de teste', tts.ok)
  const audio = new Blob([await tts.arrayBuffer()], { type: 'audio/mpeg' })
  const transcricao = await transcrever(audio, 'fala.mp3')
  console.log('   transcrição:', transcricao)
  check('1. Whisper transcreveu o áudio (menciona "buraco")', /buraco/i.test(transcricao))

  const estr1 = await gerar({ tier: 'local', sistema: SISTEMA, prompt: transcricao, temperatura: 0 })
  console.log('   estruturado (voz):', estr1.replace(/\s+/g, ' ').slice(0, 160))
  check('2. relato de voz vira demanda estruturada (JSON)', estr1.includes('{') && /tema/i.test(estr1))

  // ---------- FOTO: imagem real → Visão ----------
  const candidatas = [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Pothole_Big.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Chuckhole.jpg',
  ]
  let dataUrl = ''
  for (const u of candidatas) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'crm-poc/1.0' } })
      if (r.ok) {
        const b = Buffer.from(await r.arrayBuffer())
        dataUrl = `data:${r.headers.get('content-type') ?? 'image/jpeg'};base64,${b.toString('base64')}`
        break
      }
    } catch { /* tenta a próxima */ }
  }
  check('3. baixou imagem de teste', !!dataUrl)
  if (dataUrl) {
    const relato = await lerImagem(dataUrl, 'Descreva em português o problema de via pública nesta foto, como um relato para virar demanda.')
    console.log('   relato da foto:', relato.replace(/\s+/g, ' ').slice(0, 200))
    check('4. Visão descreveu a foto (relato não-vazio)', relato.trim().length > 20)

    const estr2 = await gerar({ tier: 'local', sistema: SISTEMA, prompt: relato, temperatura: 0 })
    console.log('   estruturado (foto):', estr2.replace(/\s+/g, ' ').slice(0, 160))
    check('5. relato de foto vira demanda estruturada (JSON)', estr2.includes('{') && /tema/i.test(estr2))
  }

  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Captura multimodal: voz (Whisper) e foto (Visão) → demanda, ao vivo.')
}

main().catch((e) => { console.error(e); process.exit(1) })
