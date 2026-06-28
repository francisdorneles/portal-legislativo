import { chromium } from 'playwright';

const BASE = 'http://localhost:3003';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });

// Get full page height
const height = await page.evaluate(() => document.body.scrollHeight);
console.log('Full page height:', height);

// Screenshot each section
for (let y = 0; y <= Math.min(height, 8000); y += 800) {
  await page.evaluate(s => window.scrollTo(0, s), y);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `scripts/screenshots/home-y${y}.png` });
  console.log(`screenshot at y=${y}`);
}

// Check HTML for notícias content
const html = await page.content();
console.log('\nNotícias section present:', html.includes('Últimas notícias') || html.includes('noticia') ? '✅' : '❌');
console.log('Vereadores section present:', html.includes('Nossos Vereadores') || html.includes('Vereador') ? '✅' : '❌');
console.log('Vídeos section present:', html.includes('Vídeos') || html.includes('youtube.com') ? '✅' : '❌');

// Check Cláudio encoding on vereadores page
await page.goto(BASE + '/vereadores', { waitUntil: 'networkidle', timeout: 30000 });
const vHtml = await page.content();
// Search byte-by-byte variant
const hasClaudios = vHtml.includes('Cl') && vHtml.includes('udio');
console.log('\nHas "Cl...udio":', hasClaudios);
// Extract text around any match
const idx = vHtml.indexOf('Bastos');
if (idx > -1) {
  console.log('Context around Bastos:', vHtml.substring(idx - 100, idx + 100).replace(/\s+/g, ' '));
}

await browser.close();
