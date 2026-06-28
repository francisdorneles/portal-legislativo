import { chromium } from 'playwright';

const BASE = 'http://localhost:3003';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Home - topo das notícias
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/screenshots/noticias-home-top.png' });

await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/screenshots/noticias-home-grade.png' });

// Página de uma notícia individual
await page.goto(BASE + '/noticias/camara-aprova-projetos-assistencia-social-esporte-saude', { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: 'scripts/screenshots/noticia-individual.png' });

const html = await page.content();
console.log('unknown node:', html.includes('unknown node') ? '❌ AINDA PRESENTE' : '✅ removido');
console.log('Conteúdo legislativo:', html.includes('sessão ordinária') ? '✅' : '❌');

await browser.close();
