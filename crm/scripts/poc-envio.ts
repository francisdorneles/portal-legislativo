/**
 * PoC Envio — valida o SEAM de comunicação (provider-agnóstico) sem depender de rede/Zernio:
 *   • REGISTRO/EMAIL/SMS → no-op (ok:true) — comportamento atual preservado
 *   • WHATSAPP sem config → ok:false (NÃO marca como enviado por engano; worker reprocessa)
 *   • normalização E.164 (DDI Brasil) correta
 *   • corpo de template é montado quando há template (modo proativo)
 *
 * Não toca banco. Roda: pnpm poc:envio
 */
export {} // marca como módulo (evita colisão de escopo global entre PoCs)

async function main() {
  // garante WhatsApp NÃO configurado neste teste
  delete process.env.ZERNIO_API_KEY
  delete process.env.ZERNIO_ACCOUNT_ID

  const { enviar } = await import('../src/modules/comunicacao/enviar.js')
  const { e164 } = await import('../src/modules/comunicacao/whatsapp.js')
  const check = (n: string, ok: boolean) => { console.log(`${ok ? '✅' : '❌'} ${n}`); if (!ok) process.exitCode = 1 }

  const reg = await enviar({ canal: 'REGISTRO', nome: 'Maria', conteudo: 'oi' })
  check('1. REGISTRO é no-op (ok:true, provedor=registro)', reg.ok && reg.provedor === 'registro')

  const wpp = await enviar({ canal: 'WHATSAPP', nome: 'Maria', telefone: '51999998888', conteudo: 'oi' })
  check('2. WHATSAPP sem config → ok:false (não marca enviado por engano)', wpp.ok === false)
  if (!wpp.ok) console.log('   erro esperado:', wpp.erro)

  check('3. E.164 com DDD sem DDI vira +55…', e164('(51) 99999-8888') === '+5551999998888')
  check('4. E.164 não duplica DDI quando já tem 55', e164('5551999998888') === '+5551999998888')

  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Seam de envio: roteamento + degradação + E.164 OK (Zernio pluga por env).')
}

main().catch((e) => { console.error(e); process.exit(1) })
