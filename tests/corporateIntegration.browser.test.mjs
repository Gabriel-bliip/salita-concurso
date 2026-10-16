/* global document, window, location, innerWidth */
import { spawn } from 'node:child_process'
import { mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import { rm } from 'node:fs/promises'

// Optional Chromium test: all requests stay in memory; catalog files are read-only.
test('corporate journey: modal, approve/reject, allowances, timelines and individual booking', { skip: !process.env.SALITA_BROWSER, timeout: 120000 }, async () => {
  const { createServer } = await import(pathToFileURL(resolve('node_modules/vite/dist/node/index.js')))
  const { LOCATIONS } = await import(pathToFileURL(resolve('src/data/coworks.ts')))
  const { calculateBookingPrice } = await import(pathToFileURL(resolve('src/lib/pricing.ts')))
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const profile = mkdtempSync(join(tmpdir(), 'salita-integration-'))
  const browser = spawn(process.env.SALITA_BROWSER, ['--headless=new', '--no-first-run', '--guest', '--disable-sync', '--disable-extensions', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  let socket
  try {
    for (let i = 0; !existsSync(join(profile, 'DevToolsActivePort')) && i < 100; i++) await delay(100)
    const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
    await new Promise((r, j) => { socket.onopen = r; socket.onerror = j })
    let seq = 0
    const pending = new Map(), exceptions = []
    socket.onmessage = ({ data }) => {
      const m = JSON.parse(data)
      if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id) }
      if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params)
    }
    const call = (method, params = {}) => new Promise((r, j) => {
      const id = ++seq, timer = setTimeout(() => j(Error(method)), 10000)
      pending.set(id, m => { clearTimeout(timer); m.error ? j(m.error) : r(m.result) })
      socket.send(JSON.stringify({ id, method, params }))
    })
    const evaluate = async (fn, ...args) => {
      const r = await call('Runtime.evaluate', { expression: `(${fn.toString()})(...${JSON.stringify(args)})`, returnByValue: true })
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails))
      return r.result.value
    }
    const until = async (fn, ...args) => {
      for (let i = 0; i < 150; i++) { if (await evaluate(fn, ...args)) return; await delay(100) }
      throw Error(`Timeout ${fn}; ${await evaluate(() => document.querySelector('main')?.innerText.slice(0, 1200))}`)
    }
    const click = async text => {
      await until(t => {
        const element = Array.from(document.querySelectorAll('main button,main a,header nav a')).find(e => e.textContent.trim() === t && !e.disabled)
        if (!element) return false
        element.focus()
        element.click()
        return true
      }, text)
    }
    const onStep = async step => until(s => new URLSearchParams(location.search).get('step') === s, step)
    const history = async () => {
      await until(() => Array.from(document.querySelectorAll('main section')).some(s => s.querySelector('h2')?.textContent === 'Historial de solicitudes'))
      return evaluate(() => Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Historial de solicitudes')?.querySelector('li')?.innerText)
    }
    await call('Runtime.enable'); await call('Page.enable')
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await call('Page.navigate', { url: origin })
    await until(() => !!document.querySelector('main h1'))
    await evaluate(() => { window.__integrationPage = 'same-document' })
    await click('Soluciones para empresas')
    await until(() => location.pathname === '/empresa')
    await click('Portal empleado')
    await until(() => location.pathname === '/empleado')
    assert.equal(await evaluate(() => document.querySelectorAll('main form').length), 0)

    async function requestFromCatalog(browseLabel, decision, uncapped = false) {
      await click(browseLabel)
      await until(() => !!document.querySelector('main section a[href^="/ubicaciones/"]'))
      const slug = await evaluate(() => document.querySelector('main section a[href^="/ubicaciones/"]').getAttribute('href').split('/').at(-1))
      const venue = LOCATIONS.find(l => l.slug === slug)
      await evaluate(() => document.querySelector('main section a[href^="/ubicaciones/"]').click())
      await click('Reservar')
      await until(() => !!document.querySelector('main article a'))
      await evaluate(() => document.querySelector('main article a').click())
      await onStep('date')
      if (!decision) await click('Reservar por mi cuenta')
      // Tomorrow or the next open day avoids time-of-day sensitivity.
      await evaluate(() => Array.from(document.querySelectorAll('main section button[aria-pressed]')).filter(b => !b.disabled)[1].click())
      await click('Continuar'); await onStep('time')
      await evaluate(() => document.querySelector('main section button[aria-pressed]:not(:disabled)').click())
      // Meeting rooms may have a two-hour minimum.
      const selectedId = await evaluate(() => new URLSearchParams(location.search).get('space'))
      const unit = venue.spaces.find(s => s.id === selectedId)
      if (unit.minHours > 1) {
        const start = await evaluate(() => Number(new URLSearchParams(location.search).get('start')))
        await evaluate(target => Array.from(document.querySelectorAll('main section button[aria-pressed]:not(:disabled)')).find(b => Number(b.textContent.trim().split(':')[0]) === target).click(), start + unit.minHours - 1)
      }
      await click('Continuar'); await onStep('people')
      await click('Continuar'); await onStep('summary')
      if (!decision) {
        await click('Ir al pago'); await onStep('payment')
        await evaluate(() => Array.from(document.querySelectorAll('main button')).find(b => b.textContent.includes('Confirmar pago simulado')).click())
        await until(() => location.pathname.endsWith('/confirmacion'))
        return
      }
      assert.equal(await evaluate(() => Array.from(document.querySelectorAll('main button')).some(b => b.textContent === 'Ir al pago')), false)
      const params = await evaluate(() => Object.fromEntries(new URLSearchParams(location.search)))
      const amount = calculateBookingPrice({ pricePerHour: unit.pricePerHour, hours: Number(params.end) - Number(params.start) }).total
      const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
      await click('Solicitar a mi empresa')
      await until(() => !!document.querySelector('[role="dialog"]'))
      assert.equal(await evaluate(() => document.activeElement.getAttribute('role')), 'dialog')
      const dialogText = await evaluate(() => document.querySelector('[role="dialog"]').innerText)
      assert.ok(dialogText.includes(venue.name) && dialogText.includes(unit.name) && dialogText.includes(money), dialogText)
      assert.equal(await evaluate(() => !!document.querySelector('[role="dialog"] [role="progressbar"]')), !uncapped)
      await click('Cancelar')
      assert.equal(await evaluate(() => location.pathname.startsWith('/reservar/')), true)
      assert.equal(await evaluate(() => document.activeElement.textContent), 'Solicitar a mi empresa')
      await click('Solicitar a mi empresa')
      await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true })
      assert.equal(await evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      await click('Solicitar aprobación')
      await until(() => location.pathname === '/empleado')
      let text = await history()
      assert.ok(text.includes(venue.name) && text.includes(unit.name) && text.includes('Pendiente'), text)
      assert.ok(text.includes(money), text)
      assert.deepEqual(await evaluate(() => Array.from(Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Historial de solicitudes').querySelector('li').querySelectorAll('ol li'), e => e.dataset.state)), ['done', 'current', 'upcoming', 'upcoming'])
      await click('Para empresas'); await until(() => location.pathname === '/empresa')
      await until(name => Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Solicitudes pendientes')?.querySelector('li h3')?.textContent.includes(name), unit.name)
      const companyText = await evaluate(() => Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Solicitudes pendientes')?.querySelector('li')?.innerText)
      assert.ok(companyText.includes(venue.name) && companyText.includes(unit.name) && companyText.includes(money), companyText)
      await evaluate(label => {
        const section = Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Solicitudes pendientes')
        Array.from(section.querySelector('li').querySelectorAll('button')).find(b => b.textContent.trim() === label).click()
      }, decision)
      await click('Portal empleado'); await until(() => location.pathname === '/empleado')
      text = await history()
      assert.ok(text.includes(decision === 'Aprobar' ? 'Aprobada' : 'Rechazada'), text)
      const progress = await evaluate(() => Array.from(Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Historial de solicitudes').querySelector('li').querySelectorAll('ol li'), e => e.dataset.state))
      assert.deepEqual(progress, decision === 'Aprobar' ? ['done', 'done', 'done', 'upcoming'] : ['done', 'done', 'rejected', 'skipped'])
      assert.equal(text.includes('Autorización simulada en Avalanche'), decision === 'Aprobar')
      if (decision === 'Aprobar') {
        assert.ok(text.includes('0 de 2 firmas') && text.includes('no existe en la cadena'), text)
        assert.equal(text.includes('Firma simulada'), false)
      }
      return { slug, params }
    }
    await requestFromCatalog('Explorar coworks', 'Aprobar')
    await click('Reiniciar demo')
    await requestFromCatalog('Explorar salas de reuniones', 'Rechazar')
    await click('Para empresas')
    await until(() => Array.from(document.querySelectorAll('main section')).some(s => s.querySelector('h2')?.textContent === 'Colaboradores'))
    await evaluate(() => Array.from(document.querySelectorAll('main section')).find(s => s.querySelector('h2')?.textContent === 'Colaboradores').querySelector('button[role="switch"]').click())
    await click('Portal empleado')
    await requestFromCatalog('Explorar salas de reuniones', 'Aprobar', true)
    await requestFromCatalog('Explorar coworks')
    assert.equal(await evaluate(() => window.__integrationPage), 'same-document')
    for (const label of ['Para empresas', 'Portal empleado']) {
      await click(label)
      await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true })
      await delay(150)
      assert.equal(await evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label} mobile overflow`)
    }
    assert.equal(exceptions.length, 0, JSON.stringify(exceptions))
    await call('Browser.close')
  } finally { socket?.close(); browser.kill(); await server.close(); await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {}) }

})
