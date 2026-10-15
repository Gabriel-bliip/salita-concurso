import assert from 'node:assert/strict'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Optional real-browser smoke test; no automation dependency or real-data writes.
test('admin browser: forms, filters, image preview, CRUD and mobile layout', { skip: !process.env.SALITA_BROWSER, timeout: 120000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'salita-browser-'))
  const profile = mkdtempSync(join(tmpdir(), 'salita-profile-'))
  const realFile = resolve('src/data/locations.json')
  const original = readFileSync(realFile, 'utf8')
  let browser, server, socket, closeBrowser
  try {
    cpSync(resolve('src'), join(root, 'src'), { recursive: true })
    const registry = join(root, 'src/data/categories.ts')
    const category = { id: 'test-category', name: 'Categoría temporal', filters: { comuna: true }, attributes: [
      { id: 'area', label: 'Superficie temporal', type: 'number', min: 1, required: true },
      { id: 'quiet', label: 'Aislamiento temporal', type: 'boolean' },
      { id: 'equipment', label: 'Equipo temporal', type: 'select', filter: true, required: true, options: [{ value: 'piano', label: 'Piano temporal' }] },
    ] }
    writeFileSync(registry, readFileSync(registry, 'utf8').replace('const definitions = [', `const definitions = [${JSON.stringify(category)},`))
    cpSync(resolve('index.html'), join(root, 'index.html'))
    mkdirSync(join(root, 'public/images'), { recursive: true })
    writeFileSync(join(root, 'public/images/local.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=', 'base64'))
    symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'junction')
    mkdirSync(join(root, 'scripts'))
    cpSync(resolve('scripts/admin-plugin.mjs'), join(root, 'scripts/admin-plugin.mjs'))
    const { adminPlugin } = await import(pathToFileURL(join(root, 'scripts/admin-plugin.mjs')).href)
    server = await createServer({ configFile: false, root, cacheDir: join(root, '.vite'), optimizeDeps: { noDiscovery: true, entries: [], include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'] }, plugins: [react(), tailwindcss(), adminPlugin()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' })
    await server.listen()
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`
    browser = spawn(process.env.SALITA_BROWSER, ['--headless=new', '--no-first-run', '--guest', '--disable-sync', '--disable-extensions', '--disable-background-networking', '--disable-features=msImplicitSignin', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
    browser.on('error', () => {})
    const portFile = join(profile, 'DevToolsActivePort')
    for (let i = 0; !existsSync(portFile) && i < 200; i++) await delay(100)
    assert.ok(existsSync(portFile), 'El navegador debe habilitar CDP')
    const port = readFileSync(portFile, 'utf8').split('\n')[0]
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    const target = targets.find(({ type, url }) => type === 'page' && url === 'about:blank')
    assert.ok(target, 'Debe existir una pestaña vacía del perfil temporal')
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
    let seq = 0
    const pending = new Map()
    const exceptions = [], requests = [], updates = []
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data)
      if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params)
      if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
      if (message.method === 'Network.webSocketFrameReceived') updates.push(message.params.response.payloadData)
      if (message.method === 'Page.javascriptDialogOpening') void call('Page.handleJavaScriptDialog', { accept: true })
    }
    function call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++seq
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 10000)
        pending.set(id, (message) => { clearTimeout(timer); if (message.error) reject(new Error(message.error.message)); else resolve(message.result) })
        socket.send(JSON.stringify({ id, method, params }))
      })
    }
    closeBrowser = () => call('Browser.close')
    async function evaluate(expression) {
      const value = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).catch((error) => { throw new Error(`Evaluating: ${expression}`, { cause: error }) })
      if (value.exceptionDetails) throw new Error(JSON.stringify(value.exceptionDetails))
      return value.result.value
    }
    async function until(expression) {
      for (let i = 0; i < 300; i++) { if (await evaluate(expression)) return; await delay(100) }
      throw new Error(`Timeout: ${expression}; browser exceptions: ${JSON.stringify(exceptions)}; HMR: ${JSON.stringify(updates.slice(-5))}; page: ${await evaluate('document.body.innerText.slice(0, 500)')}`)
    }
    async function click(text) {
      await until(`Array.from(document.querySelectorAll('button')).some(b => b.textContent === ${JSON.stringify(text)} && !b.disabled)`)
      await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === ${JSON.stringify(text)}).click()`)
      await delay(100)
    }
    async function input(label, value) {
      await until(`Array.from(document.querySelectorAll('label span')).some(e => e.textContent === ${JSON.stringify(label)})`)
      await evaluate(`(() => { const e = Array.from(document.querySelectorAll('label')).find(l => l.querySelector('span')?.textContent === ${JSON.stringify(label)}).querySelector('input,textarea'); Object.getOwnPropertyDescriptor(e instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(value)}); e.dispatchEvent(new Event('input', { bubbles: true })); })()`)
      await delay(100)
    }
    async function select(label, value) {
      await evaluate(`(() => { const e = Array.from(document.querySelectorAll('label')).find(l => l.querySelector('span')?.textContent === ${JSON.stringify(label)}).querySelector('select'); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
      await delay(100)
    }
    await call('Runtime.enable'); await call('Network.enable'); await call('Page.enable')
    await call('Network.setBlockedURLs', { urls: ['https://example.com/*'] })
    await call('Page.navigate', { url: `${origin}/admin` })
    await until("document.querySelectorAll('article').length > 0")
    assert.ok(!requests.some((url) => /leaflet|maplibre|BookingPage|\/lib\/booking/.test(url)))
    const count = await evaluate("document.querySelectorAll('article').length")
    await input('Buscar por nombre', 'sin-coincidencias-browser')
    await until("document.querySelectorAll('article').length === 0")
    await click('Limpiar filtros')
    assert.equal(await evaluate("document.querySelectorAll('article').length"), count)
    await click('Crear espacio')
    await input('Nombre', 'Borrador cancelado')
    assert.deepEqual(await evaluate("(() => { const e = Array.from(document.querySelectorAll('label')).find(l => l.querySelector('span')?.textContent === 'Comuna').querySelector('select'); return [e.value, e.options.length, new Set(Array.from(e.options, o => o.value)).size]; })()"), ['Providencia', 52, 52])
    await evaluate(`(() => { const dt = new DataTransfer(); dt.items.add(new File(['preview'], 'cancelada.png', { type: 'image/png' })); const e = document.querySelector('input[type=file]'); e.files = dt.files; e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
    await until("document.querySelector('.admin-photo')?.src.startsWith('data:')")
    for (const reference of ['https://example.com/foto.jpg', '/images/local.png']) {
      await input('URL HTTPS o ruta pública de imagen', reference)
      await click('Añadir imagen')
    }
    assert.equal(await evaluate("document.querySelectorAll('.admin-photo').length"), 3)
    assert.equal(readFileSync(join(root, 'src/data/locations.json'), 'utf8'), original)
    assert.ok(!existsSync(join(root, 'public/images/admin')))
    await click('Cancelar')
    await until("!document.querySelector('form')")
    assert.equal(readFileSync(join(root, 'src/data/locations.json'), 'utf8'), original)
    await click('Editar')
    await input('Nombre', 'Edición cancelada')
    await click('Cancelar')
    await until("!document.querySelector('form')")
    assert.equal(readFileSync(join(root, 'src/data/locations.json'), 'utf8'), original)
    await click('Crear espacio')
    await input('Nombre', 'Prueba navegador')
    await select('Comuna', 'Buin')
    await input('Dirección', 'Calle temporal 123')
    await input('Descripción', 'Descripción temporal')
    await select('Categoría', category.id)
    await input('Superficie temporal', '40')
    await select('Equipo temporal', 'piano')
    await until("Array.from(document.querySelectorAll('label')).some(l => l.textContent.includes('Aislamiento temporal') && l.querySelector('input[type=checkbox]'))")
    await click('Añadir sala de reuniones')
    await input('Nombre del espacio reservable', 'Sala temporal')
    await input('Descripción del espacio reservable', 'Unidad temporal')
    await input('Precio por hora (CLP)', '5000')
    await input('Capacidad mínima', '2')
    await input('Capacidad máxima', '6')
    await evaluate(`(() => { const file = new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII='), c => c.charCodeAt(0))], 'prueba.png', { type: 'image/png' }); const dt = new DataTransfer(); dt.items.add(file); const e = document.querySelector('input[type=file]'); e.files = dt.files; e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
    await until("document.querySelector('.admin-photo')?.src.startsWith('data:')")
    for (const reference of ['https://example.com/foto.jpg', '/images/local.png']) {
      await input('URL HTTPS o ruta pública de imagen', reference)
      await click('Añadir imagen')
    }
    await input('Descripción de imagen 1', '')
    await evaluate("document.querySelector('form').requestSubmit()")
    await delay(100)
    assert.equal(readFileSync(join(root, 'src/data/locations.json'), 'utf8'), original)
    assert.ok(!existsSync(join(root, 'public/images/admin')))
    await click('Guardar')
    await until("document.querySelectorAll('article').length > 0")
    let stored = JSON.parse(readFileSync(join(root, 'src/data/locations.json'), 'utf8'))
    assert.equal(stored.at(-1).name, 'Prueba navegador')
    assert.equal(stored.at(-1).comuna, 'Buin')
    assert.deepEqual(stored.at(-1).attributes, { area: 40, equipment: 'piano' })
    assert.deepEqual(stored.at(-1).spaces[0].capacity, { min: 2, max: 6 })
    assert.ok(existsSync(join(root, 'public', stored.at(-1).images[0])))
    assert.deepEqual(stored.at(-1).images.slice(1), ['https://example.com/foto.jpg', '/images/local.png'])
    assert.deepEqual(stored.at(-1).photoCaptions, ['', '', ''])
    assert.ok(await evaluate("document.querySelector('[role=status]')?.textContent.includes('Cambios guardados')"))
    await input('Buscar por nombre', 'Prueba navegador')
    await click('Editar')
    assert.equal(await evaluate("Array.from(document.querySelectorAll('label')).find(l => l.querySelector('span')?.textContent === 'Superficie temporal').querySelector('input').value"), '40')
    await input('Nombre', 'Prueba navegador editada')
    for (let i = 0; i < 3; i++) await click('Quitar imagen')
    await until("!document.querySelector('.admin-photo')")
    await click('Guardar')
    await until("document.querySelectorAll('article').length === 1")
    await click('Duplicar')
    await click('Guardar')
    await until("document.querySelectorAll('article').length === 2")
    await click('Eliminar')
    await until("document.querySelectorAll('article').length === 1")
    await click('Eliminar')
    await until("document.querySelectorAll('article').length === 0")
    stored = JSON.parse(readFileSync(join(root, 'src/data/locations.json'), 'utf8'))
    assert.deepEqual(stored, JSON.parse(original))
    await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await click('Limpiar filtros')
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
    assert.deepEqual(exceptions, [])
  } finally {
    if (closeBrowser) await Promise.race([closeBrowser().catch(() => {}), delay(3000)])
    socket?.close()
    await delay(1000)
    if (browser && browser.exitCode === null) {
      browser.kill()
      await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), delay(5000)])
    }
    await server?.close()
    // Remove the junction itself, never traverse the project's dependencies.
    if (existsSync(join(root, 'node_modules'))) rmSync(join(root, 'node_modules'), { recursive: true, force: true })
    await rm(root, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 })
    await rm(profile, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 })
    assert.equal(readFileSync(realFile, 'utf8'), original)
  }
})
