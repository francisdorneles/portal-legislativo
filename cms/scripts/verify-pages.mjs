import { chromium } from 'playwright';

const BASE = 'http://localhost:3003';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function shot(name) {
  await page.screenshot({ path: `scripts/screenshots/${name}.png` });
}

// VEREADORES
await page.goto(BASE + '/vereadores', { waitUntil: 'networkidle', timeout: 30000 });
await shot('pg-vereadores');
console.log('✅ /vereadores carregada');

// CONTATO
await page.goto(BASE + '/contato', { waitUntil: 'networkidle', timeout: 30000 });
await shot('pg-contato');
const cHtml = await page.content();
console.log('Contato taquari:', cHtml.includes('Taquari') ? '✅' : '❌');
console.log('Telefone:', cHtml.includes('91005') ? '✅ (51) 91005-8085' : '❌');

// INSTITUCIONAL
await page.goto(BASE + '/institucional/a-camara', { waitUntil: 'networkidle', timeout: 30000 });
await shot('pg-institucional');
console.log('✅ /institucional/a-camara carregada');

// TRANSPARENCIA
await page.goto(BASE + '/transparencia', { waitUntil: 'networkidle', timeout: 30000 });
await shot('pg-transparencia');
const tHtml = await page.content();
console.log('Digifred:', tHtml.includes('digifred') || tHtml.includes('Digifred') ? '✅' : '❌');
console.log('CESPRO:', tHtml.includes('cespro') || tHtml.includes('CESPRO') ? '✅' : '❌');
console.log('TCE-RS:', tHtml.includes('tce.rs') ? '✅' : '❌');

// HOME - scroll to see videos section
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(800);
await shot('home-videos-area');

await browser.close();
console.log('\nScreenshots salvos em scripts/screenshots/');
