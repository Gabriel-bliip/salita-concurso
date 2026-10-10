// PostToolUse hook: lint the edited .ts/.tsx file and feed errors back to Claude (exit 2).
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const file = input.tool_input?.file_path ?? input.tool_response?.filePath
if (!file || !/\.(ts|tsx)$/.test(file)) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const eslint = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js')
if (!existsSync(eslint)) process.exit(0)

const result = spawnSync(process.execPath, [eslint, file], { cwd: root, encoding: 'utf8' })
if (result.status === 1) {
  process.stderr.write(`ESLint errors in ${file}:\n${result.stdout}${result.stderr}`)
  process.exit(2)
}
