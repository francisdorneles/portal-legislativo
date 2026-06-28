/** Testa os limiares do termômetro (função pura, sem banco). pnpm tsx scripts/poc-termometro.ts */
import { temperatura } from '../src/modules/crm/relacionamento.js'

const agora = new Date('2026-06-24T12:00:00')
const d = (n: number) => new Date(agora.getTime() - n * 86_400_000)
function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

check('nunca contatado = frio', temperatura(null, agora) === 'frio')
check('10 dias = quente', temperatura(d(10), agora) === 'quente')
check('30 dias = quente (limiar)', temperatura(d(30), agora) === 'quente')
check('45 dias = esfriando', temperatura(d(45), agora) === 'esfriando')
check('90 dias = esfriando (limiar)', temperatura(d(90), agora) === 'esfriando')
check('120 dias = frio', temperatura(d(120), agora) === 'frio')
console.log(process.exitCode ? '\n⚠️ termômetro FALHOU' : '\n🎉 termômetro OK')
