import { chromium } from 'playwright-core'

const URL = 'http://localhost:9000/'
const channels = ['msedge', 'chrome']
let browser
for (const ch of channels) {
  try { browser = await chromium.launch({ channel: ch, headless: true }); break } catch { /* try next */ }
}
if (!browser) { console.log('NO_BROWSER'); process.exit(2) }

const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

console.log('URL inicial:', page.url())

// quantos links de nav existem
const links = await page.$$eval('aside a', (els) => els.map((e) => ({ text: e.textContent.trim(), href: e.getAttribute('href') })))
console.log('LINKS:', JSON.stringify(links))

// body pointer-events?
const pe = await page.evaluate(() => getComputedStyle(document.body).pointerEvents)
console.log('body pointer-events:', pe)

// tenta clicar em "Despesas"
async function clickNav (label) {
  const link = page.locator('aside a', { hasText: label }).first()
  await link.click({ timeout: 3000 }).catch((e) => console.log('CLICK FAIL', label, e.message))
  await page.waitForTimeout(500)
  console.log(`apos clicar "${label}" -> URL:`, page.url(), '| H1:', await page.locator('main h1').first().textContent().catch(() => '??'))
}

await clickNav('Despesas')
await clickNav('Orçamento')
await clickNav('Categorias')

// elemento no ponto do link (detecta overlay cobrindo)
const topEl = await page.evaluate(() => {
  const a = document.querySelector('aside a:nth-child(3)')
  if (!a) return 'sem link'
  const r = a.getBoundingClientRect()
  const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
  return el ? el.tagName + '.' + (el.className?.toString().slice(0, 40)) : 'null'
})
console.log('elemento no centro do 3o link:', topEl)

console.log('ERROS:', errors.length ? errors.join('\n') : 'nenhum')
await browser.close()
