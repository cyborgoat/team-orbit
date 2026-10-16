import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
const directory = mkdtempSync(join(tmpdir(), 'orbit-browser-test-'))
const api = resolve('../api')
const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: `file:${join(directory, 'test.db')}`, UPLOAD_DIR: join(directory, 'uploads'), PUBLIC_BASE_URL: 'http://127.0.0.1:3099', PORT: '3099', PATH: `${resolve(api, 'node_modules/.bin')}:${process.env.PATH}`,  JWT_SECRET: 'browser-smoke-test-secret', BOOTSTRAP_ADMIN_USERNAME: 'smoke-admin', BOOTSTRAP_ADMIN_NAME: 'Smoke Admin', BOOTSTRAP_ADMIN_PASSWORD: 'smoke-test-password', BOOTSTRAP_ADMIN_EMAIL: '' }
let child
try {
  const prisma = resolve(api, 'node_modules/prisma/build/index.js')
  execFileSync(process.execPath, [prisma, 'migrate', 'deploy'], { cwd: api, env, stdio: 'pipe' })
  execFileSync(process.execPath, [prisma, 'db', 'seed'], { cwd: api, env, stdio: 'pipe' })
  child = spawn(process.execPath, ['dist/main.js'], { cwd: api, env, stdio: 'inherit' })
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.once('exit', code => { rmSync(directory, { recursive: true, force: true }); process.exitCode = code || 0 })
} catch (error) { rmSync(directory, { recursive: true, force: true }); throw error }
