import { chromium } from 'playwright-core'
const URL = 'http://localhost:9000/'
let browser
for (const ch of ['msedge', 'chrome']) { try { browser = await chromium.launch({ channel: ch, headless: true }); break } catch {} }
if (!browser) { console.log('NO_BROWSER'); process.exit(2) }
const page = await browser.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const bodyPE = () => page.evaluate(() => getComputedStyle(document.body).pointerEvents)
console.log('inicial body PE:', await bodyPE())

// 1) abre o Select de periodo e fecha (Escape)
await page.locator('header button[aria-label], header [role="combobox"], header button').first().click().catch(() => {})
await page.waitForTimeout(300)
// tenta clicar no trigger do select diretamente
const trigger = page.locator('[role="combobox"]').first()
if (await trigger.count()) {
  await trigger.click().catch(() => {})
  await page.waitForTimeout(400)
  console.log('com Select ABERTO body PE:', await bodyPE())
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}
console.log('apos fechar Select body PE:', await bodyPE())

// 2) abre Modal "Novo lançamento" e fecha
await page.locator('header button', { hasText: 'Novo' }).first().click().catch((e) => console.log('btn novo fail', e.message))
await page.waitForTimeout(500)
console.log('com Modal ABERTO body PE:', await bodyPE())
await page.keyboard.press('Escape')
await page.waitForTimeout(600)
console.log('apos fechar Modal body PE:', await bodyPE())

// 3) agora tenta navegar
const link = page.locator('aside a', { hasText: 'Despesas' }).first()
let navOk = true
await link.click({ timeout: 3000 }).catch((e) => { navOk = false; console.log('CLICK FAIL:', e.message) })
await page.waitForTimeout(400)
console.log('apos tentar navegar -> URL:', page.url(), '| navOk:', navOk)

await browser.close()
