import { chromium } from 'playwright';

const API = 'https://hml-api.zaldemy.com';
const cats = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, categoria: `Categoria ${i + 1}`, total_frases: 5 }));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 390, height: 780 } });
const page = await context.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));

await context.route(`${API}/controller/me.php`, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ authenticated: true, user: { id: 1, name: 'Teste', email: 't@t.com', step: 3, plano: 1, native_language: 'pt', learning_language: 'en' } }) }));
await context.route(`${API}/controller/language.php`, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 1, sigla: 'pt' }]) }));
await context.route(`${API}/controller/categorias.php`, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(cats) }));

await page.addInitScript(() => localStorage.setItem('token', 'fake-token'));
await page.goto('http://localhost:5173/listcategorias', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

await page.screenshot({ path: '/home/marcios/Documentos/zaldemy-front/lcbar-1-top.png' });

await page.mouse.move(195, 400);
for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(30); }
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/marcios/Documentos/zaldemy-front/lcbar-2-scrolled.png' });

await browser.close();
