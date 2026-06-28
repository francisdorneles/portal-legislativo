/**
 * Seed dos vereadores da Câmara Municipal de Taquari — legislatura 2025-2028.
 * Executa: node scripts/seed-vereadores-taquari.mjs
 * Requer servidor rodando em localhost:3003 com CAMARA=taquari.
 */

const BASE = 'http://localhost:3003'
const EMAIL = 'francistk@gmail.com'
const SENHA = 'Pass821200!'

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  })
  if (!r.ok) throw new Error('Login falhou: ' + r.status)
  return (await r.json()).token
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await r.json()
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${JSON.stringify(json).slice(0, 300)}`)
  return json
}

// Vereadores da legislatura 2025-2028
// Fonte: camarataquari.rs.gov.br/vereadores.html
const VEREADORES = [
  { nomeParlamentar: 'Ademir Bica Fagundes',           partido: 'PDT',    ordem: 1 },
  { nomeParlamentar: 'Aldo Gregory',                   partido: 'PP',     ordem: 2 },
  { nomeParlamentar: 'Angélica Hassen',                partido: 'PT',     ordem: 3 },
  { nomeParlamentar: 'Antônio Porfírio de Araújo Costa', partido: 'Avante', ordem: 4 },
  { nomeParlamentar: 'José Harry Saraiva Dias',        partido: 'PDT',    ordem: 5 },
  { nomeParlamentar: 'Luciano Fabiano Maria da Silva', partido: 'PT',     ordem: 6 },
  { nomeParlamentar: 'Luis Henrique Quadros Porto',    partido: 'PDT',    ordem: 7 },
  { nomeParlamentar: 'Marcelo Bernstein Lopes',        partido: 'PDT',    ordem: 8 },
  { nomeParlamentar: 'Renato Scherer da Silva',        partido: 'PDT',    ordem: 9 },
]

async function main() {
  console.log('🔑 Autenticando…')
  const token = await login()

  // Verifica se já existem vereadores
  const existentes = await api(token, 'GET', '/vereadores?limit=1')
  if (existentes.totalDocs > 0) {
    console.log(`⚠️  Já existem ${existentes.totalDocs} vereador(es) no banco. Abortando para não duplicar.`)
    console.log('   Para recriar: apague os registros em /admin → Vereadores e rode novamente.')
    process.exit(0)
  }

  for (const v of VEREADORES) {
    const criado = await api(token, 'POST', '/vereadores', { ...v, ativo: true })
    console.log(`✅ ${v.nomeParlamentar} (${v.partido}) — id ${criado.doc?.id ?? criado.id}`)
  }

  console.log('\n✅ Pronto! Acesse /admin → Vereadores para adicionar fotos e contatos.')
}

main().catch((e) => { console.error(e); process.exit(1) })
