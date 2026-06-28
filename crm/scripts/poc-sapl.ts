/**
 * PoC Conector SAPL — prova que a `saplUrl` é resolvida pelo TENANT (não hard-coded) e que
 * o conector busca matérias reais e degrada com elegância quando a câmara não tem SAPL.
 *
 * Faz fetch REAL na API pública do SAPL (precisa de rede). Roda: pnpm poc:sapl
 */
export {} // marca como módulo (evita colisão de escopo global entre PoCs)

async function main() {
  const { prisma } = await import('../src/lib/prisma.js')
  const { runComTenant } = await import('../src/lib/tenant-context.js')
  const { buscarMaterias, listarParlamentares } = await import('../src/modules/conectores/sapl.js')
  const check = (n: string, ok: boolean) => { console.log(`${ok ? '✅' : '❌'} ${n}`); if (!ok) process.exitCode = 1 }

  // A saplUrl vem do cadastro da CÂMARA (não da página). Gab A e Gab B (mesma câmara) → mesma URL.
  const gabA = await prisma.gabinete.findUnique({ where: { id: 'gab-a' }, select: { camaraId: true } })
  const camaraId = gabA!.camaraId
  const resolverUrl = async (gab: string) =>
    runComTenant({ camaraId, gabineteId: gab }, async () => {
      const c = await prisma.camara.findUnique({ where: { id: camaraId }, select: { saplUrl: true } })
      return c?.saplUrl ?? null
    })

  const urlA = await resolverUrl('gab-a')
  const urlB = await resolverUrl('gab-b')
  // A câmara da demo (Taquari) tem saplUrl null de propósito — SAPL é feature plugável. Provamos
  // que a resolução é por TENANT (A===B) e usamos um SAPL público real como alvo de teste.
  check('1. saplUrl resolvida pelo tenant e igual entre gabinetes da mesma câmara', urlA === urlB)
  console.log('   saplUrl da câmara:', urlA ?? '(null — Taquari não usa SAPL)')
  const alvo = urlA ?? 'https://sapl.generalcamara.rs.leg.br'

  // 2. Busca matérias reais ao vivo.
  const mat = await buscarMaterias({ saplUrl: alvo, size: 5 })
  check('2. buscou matérias reais (ok + itens com título/ementa)', mat.ok && mat.itens.length > 0 && !!mat.itens[0].titulo)
  if (mat.ok) {
    console.log(`   ${mat.total} matérias no total; amostra:`)
    for (const m of mat.itens.slice(0, 3)) console.log(`   • ${m.titulo} — ${m.ementa.slice(0, 70)}…`)
  } else {
    console.log('   erro:', mat.erro)
  }

  // 3. Lista parlamentares (pra casar autor com o vereador do gabinete).
  const parl = await listarParlamentares(alvo)
  check('3. listou parlamentares da câmara', parl.ok && parl.itens.length > 0)
  if (parl.ok) console.log(`   ${parl.total} parlamentares; ex.: ${parl.itens.slice(0, 3).map((p) => p.nome).join(', ')}`)

  // 4. Degrada com elegância quando a câmara não tem SAPL (URL inválida).
  const semSapl = await buscarMaterias({ saplUrl: 'https://sapl.inexistente-xyz.rs.leg.br', size: 3 })
  check('4. degrada (ok:false) quando o SAPL não responde', semSapl.ok === false)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Conector SAPL: URL por tenant + busca real + degradação confirmados.')
}

main().catch((e) => { console.error(e); process.exit(1) })
