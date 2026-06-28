import { chromium } from 'playwright';

const BASE = 'http://localhost:3003';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Check home - scroll to YouTube section
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(1000);
await page.screenshot({ path: 'scripts/screenshots/home-midpage.png' });

await page.evaluate(() => window.scrollTo(0, 6000));
await page.waitForTimeout(1000);
await page.screenshot({ path: 'scripts/screenshots/home-bottom.png' });

const html = await page.content();
// Check for video-related content
const videoMatches = [...html.matchAll(/youtube|vídeo|video|iframe|thumbnail/gi)];
console.log('Video-related refs in HTML:', videoMatches.length);
console.log('Unique matches:', [...new Set(videoMatches.map(m => m[0]))].join(', '));

// Check vereadores - look for Cláudio specifically
await page.goto(BASE + '/vereadores', { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => window.scrollTo(0, 2000));
await page.screenshot({ path: 'scripts/screenshots/vereadores-bottom.png' });
const vHtml = await page.content();
// Search for partial names
console.log('\nVereadores check:');
console.log('Cláudio:', vHtml.includes('Cláudio') ? '✅' : '❌');
console.log('Bastos:', vHtml.includes('Bastos') ? '✅' : '❌');
console.log('Ehlers:', vHtml.includes('Ehlers') ? '✅' : '❌');
// Count vereador cards rendered
const cardCount = (vHtml.match(/vereador\d+\.jpg/g) || []).length;
console.log('Cards with fotos:', cardCount);

await browser.close();
