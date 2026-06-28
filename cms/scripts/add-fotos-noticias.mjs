/**
 * Faz upload das imagens e vincula às notícias já criadas.
 * Executa: node scripts/add-fotos-noticias.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3003'
const EMAIL = 'francistk@gmail.com'
const SENHA = 'Pass821200!'

async function login() {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  })
  if (r.ok) return (await r.json()).token
  throw new Error('Login falhou: ' + r.status)
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

async function uploadImagem(token, numNoticia) {
  const imgPath = resolve(__dirname, `../public/noticias/noticia${numNoticia}.jpg`)
  let fileData
  try {
    fileData = readFileSync(imgPath)
  } catch {
    console.log(`  Imagem noticia${numNoticia}.jpg não encontrada`)
    return null
  }

  const form = new FormData()
  const blob = new Blob([fileData], { type: 'image/jpeg' })
  form.append('file', blob, `noticia${numNoticia}.jpg`)
  form.append('_payload', JSON.stringify({ alt: `Câmara Municipal de Taquari - Notícia ${numNoticia}` }))

  const r = await fetch(`${BASE}/api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const json = await r.json()
  if (json.doc?.id) return json.doc.id
  console.log(`  Upload FALHOU:`, JSON.stringify(json).slice(0, 300))
  return null
}

// Mapa: slug da notícia → número da imagem
const MAPA = [
  ['camara-aprova-projetos-assistencia-social-esporte-saude', 87],
  ['camara-homenagens-projetos-saude-infraestrutura', 86],
  ['sessao-ordinaria-18-maio-2026', 85],
  ['camara-aprova-cultura-esporte-seguranca-nautica', 84],
  ['sessao-ordinaria-04-maio-2026', 83],
  ['camara-aprova-materias-participacao-comunitaria', 82],
  ['sessao-ordinaria-06-abril-2026', 81],
  ['sessao-ordinaria-30-marco-2026', 80],
  ['sessao-ordinaria-23-marco-2026', 79],
  ['sessao-ordinaria-16-marco-2026', 78],
  ['sessao-ordinaria-09-marco-2026', 77],
  ['camara-retoma-sessoes-apos-recesso', 76],
  ['visita-ifsul-camara-triunfo', 75],
  ['sessao-extraordinaria-28-janeiro-2026', 74],
  ['sessao-ordinaria-26-janeiro-2026', 73],
  ['camara-aprova-reajustes-anuais-municipio', 72],
  ['sessao-ordinaria-19-janeiro-2026', 71],
  ['vereadores-visita-tk-calcados', 70],
  ['retomada-trabalhos-1-sessao-ordinaria-2026', 69],
  ['terno-de-reis-33-natal-acoriano', 68],
  ['ultima-sessao-ordinaria-2025', 67],
  ['camara-4-atos-em-sessao', 66],
  ['eleita-mesa-diretora-camara-2026', 65],
  ['sessao-ordinaria-01-dezembro-2025', 64],
  ['sessao-extraordinaria-e-ordinaria-24-novembro-2025', 63],
]

async function main() {
  console.log('🔑 Login...')
  const token = await login()

  // Buscar todas as notícias
  const lista = await api(token, 'GET', '/noticias?limit=100')
  const noticias = lista.docs ?? []
  console.log(`📋 ${noticias.length} notícias encontradas no banco`)

  let ok = 0
  for (const [slug, num] of MAPA) {
    const noticia = noticias.find((n) => n.slug === slug)
    if (!noticia) {
      console.log(`⚠️  Notícia não encontrada: ${slug}`)
      continue
    }
    if (noticia.foto) {
      console.log(`  [${slug}] já tem foto, pulando`)
      ok++
      continue
    }

    process.stdout.write(`  [${slug}] upload noticia${num}.jpg... `)
    const fotoId = await uploadImagem(token, num)
    if (!fotoId) continue

    const res = await api(token, 'PATCH', `/noticias/${noticia.id}`, { foto: fotoId })
    if (res.doc?.id || res.id) {
      console.log(`✅`)
      ok++
    } else {
      console.log(`❌`, JSON.stringify(res).slice(0, 200))
    }
  }

  console.log(`\n✅ ${ok}/${MAPA.length} notícias com foto.`)
}

main().catch(console.error)
