import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:3003/noticias/camara-aprova-projetos-assistencia-social-esporte-saude', { waitUntil: 'networkidle', timeout: 30000 });
await page.screenshot({ path: 'scripts/screenshots/noticia-full.png', fullPage: true });
await browser.close();
