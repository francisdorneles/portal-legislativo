/**
 * PoC Vigia do Diário Oficial — cruzamento + alertas ISOLADOS por gabinete.
 * Usa itens MOCK (a API pública fica atrás de Cloudflare; o fetch real roda na hospedagem).
 * Carrega as vars IA do .env (OpenAI) p/ resumir de verdade.
 *
 * Roda: pnpm poc:vigia
 */
import { readFileSync } from 'node:fs'
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^(IA_[A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const { prisma } = await import('../src/lib/prisma.js')
  const { runComTenant } = await import('../src/lib/tenant-context.js')
  const { processarDiario } = await import('../src/modules/ia/vigia.js')
  const check = (n: string, ok: boolean) => { console.log(`${ok ? '✅' : '❌'} ${n}`); if (!ok) process.exitCode = 1 }

  const gabA = await prisma.gabinete.findUnique({ where: { id: 'gab-a' }, select: { camaraId: true } })
  const ctxA = { camaraId: gabA!.camaraId, gabineteId: 'gab-a' }
  const ctxB = { camaraId: gabA!.camaraId, gabineteId: 'gab-b' }

  // limpa alertas de diário pra um teste limpo
  await runComTenant(ctxA, async () => { await prisma.alerta.deleteMany({ where: { tipo: 'diario' } }) })
  await runComTenant(ctxB, async () => { await prisma.alerta.deleteMany({ where: { tipo: 'diario' } }) })

  const mock = [
    { data: '2026-06-20', municipio: 'Taquari', url: 'http://diario/1.pdf', txtUrl: null, edicao: '100',
      trechos: ['empenho de R$ 80.000,00 destinado à pavimentação asfáltica da Rua Sete de Setembro, no bairro Centro'] },
    { data: '2026-06-19', municipio: 'Taquari', url: 'http://diario/2.pdf', txtUrl: null, edicao: '99',
      trechos: ['abertura de processo licitatório para iluminação pública no bairro São João'] },
  ]

  const achados = await runComTenant(ctxA, async () => await processarDiario(mock, 'Taquari'))
  check(`1. processou ${achados.length} achados e resumiu com IA`, achados.length === 2 && achados.every((a) => a.resumo.length > 5))
  console.log('   resumo[1]:', achados[0]?.resumo)

  const nA = await runComTenant(ctxA, async () => await prisma.alerta.count({ where: { tipo: 'diario' } }))
  check('2. gabinete A tem 2 alertas de diário', nA === 2)

  const nB = await runComTenant(ctxB, async () => await prisma.alerta.count({ where: { tipo: 'diario' } }))
  check('3. gabinete B NÃO vê os alertas do A (isolado)', nB === 0)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Vigia: cruzamento + alertas isolados por gabinete confirmado.')
}

main().catch((e) => { console.error(e); process.exit(1) })
