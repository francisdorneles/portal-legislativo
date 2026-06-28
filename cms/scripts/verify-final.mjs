import { chromium } from 'playwright';

const BASE = 'http://localhost:3003';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Force a fresh SSR request
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(2000);

const html = await page.content();

// Screenshot of key areas
await page.screenshot({ path: 'scripts/screenshots/final-home-top.png' });

await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/screenshots/final-home-noticias.png' });

await page.evaluate(() => window.scrollTo(0, 1600));
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/screenshots/final-home-videos.png' });

const noticiasCount = (html.match(/noticia-/g) || []).length;
const hasVideos = html.includes('youtube.com') || html.includes('youtu.be');

console.log('Notícias no HTML:', noticiasCount > 0 ? `✅ ${noticiasCount} found` : '❌ zero');
console.log('YouTube URLs:', hasVideos ? '✅' : '❌');

await browser.close();
