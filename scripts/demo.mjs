// Launches the two-session demo: company on :5173, employee on :5174, sync relay on :5175.
// Usage: node scripts/demo.mjs   (everything binds to localhost only)
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const run = (label, args) => {
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  const prefix = (stream, out) => stream.on('data', (data) => out.write(String(data).replace(/^(?=.)/gm, `[${label}] `)))
  prefix(child.stdout, process.stdout)
  prefix(child.stderr, process.stderr)
  child.on('exit', (code) => { console.log(`[${label}] exited (${code})`); shutdown() })
  return child
}

const children = [
  run('sync', ['scripts/demo-sync-server.mjs']),
  run('empresa', [vite, '--port', '5173', '--strictPort']),
  run('empleado', [vite, '--port', '5174', '--strictPort']),
]
function shutdown() { children.forEach((child) => child.kill()); setTimeout(() => process.exit(), 200) }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
console.log('Empresa:  http://localhost:5173/empresa\nEmpleado: http://localhost:5174/empleado')
