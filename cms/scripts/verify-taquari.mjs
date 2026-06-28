import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3003';
const SS_DIR = 'scripts/screenshots';

await mkdir(SS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function shot(name) {
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function check(url, name) {
  console.log(`\n▶ ${url}`);
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
  await shot(name);
  return page.content();
}

// HOME
let html = await check('/', 'home');
console.log('  noticias:', (html.match(/noticia|news/gi) || []).length, 'refs');
console.log('  youtube/video:', html.includes('youtube') || html.includes('iframe') ? '✅ ref found' : '❌ not found');
console.log('  vereadores section:', html.includes('vereador') ? '✅' : '❌');

// VEREADORES
html = await check('/vereadores', 'vereadores');
const vereadoresNomes = ['Ademir', 'Sergio', 'Marcelo', 'José Harry', 'Cláudio'];
for (const nome of vereadoresNomes) {
  console.log(`  ${nome}:`, html.includes(nome) ? '✅' : '❌ NOT FOUND');
}
// Count img tags with vereador in src
const imgMatches = [...html.matchAll(/src="[^"]*vereador[^"]*"/gi)];
console.log(`  fotos (img com 'vereador' no src): ${imgMatches.length}`);

// CONTATO
html = await check('/contato', 'contato');
console.log('  telefone:', html.includes('51') ? '✅ area code 51 found' : '❌');
console.log('  email:', html.includes('@') ? '✅' : '❌');
console.log('  endereço:', html.includes('Taquari') || html.includes('taquari') ? '✅' : '❌');

// INSTITUCIONAL
html = await check('/institucional/a-camara', 'institucional-camara');
console.log('  conteúdo:', html.length > 5000 ? '✅ rich content' : '⚠️ possibly sparse');
console.log('  câmara:', html.toLowerCase().includes('câmara') || html.toLowerCase().includes('camara') ? '✅' : '❌');

// TRANSPARENCIA
html = await check('/transparencia', 'transparencia');
console.log('  links TCE/Digifred/CESPRO:',
  html.includes('tce') || html.includes('TCE') ? '✅ TCE ref' : '❌ no TCE',
  html.includes('cespro') || html.includes('CESPRO') ? '✅ CESPRO' : '',
  html.includes('digifred') || html.includes('Digifred') ? '✅ Digifred' : '',
);

await browser.close();
console.log('\n✅ Verificação concluída. Screenshots em scripts/screenshots/');
