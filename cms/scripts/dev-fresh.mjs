/**
 * Dev server "limpo": mata qualquer processo preso na porta alvo, apaga o cache
 * do Turbopack (.next) e sobe UM único dev server na porta fixa. Use isto quando
 * o HMR travar ("a página não atualiza") — resolve a armadilha de portas zumbi /
 * cache preso documentada em docs/07-estado-atual.md.
 *
 * Uso:  pnpm dev:fresh           (lajeado)
 *       CAMARA=taquari pnpm dev:fresh
 */
import { execSync, spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const PORT = Number(process.env.PORT) || 3003

function matarPorta(porta) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' })
      const pids = new Set()
      for (const linha of out.split('\n')) {
        if (linha.includes(`:${porta} `) && /LISTENING/i.test(linha)) {
          const cols = linha.trim().split(/\s+/)
          pids.add(cols[cols.length - 1])
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
          console.log(`• matei processo ${pid} na porta ${porta}`)
        } catch {
          /* já morto */
        }
      }
    } else {
      execSync(`lsof -ti tcp:${porta} | xargs -r kill -9`, { stdio: 'ignore' })
    }
  } catch {
    /* nada escutando — ok */
  }
}

console.log(`→ dev:fresh na porta ${PORT}`)
matarPorta(PORT)

try {
  rmSync('.next', { recursive: true, force: true })
  console.log('• .next limpo')
} catch {
  /* não existia */
}

const env = {
  ...process.env,
  CAMARA: process.env.CAMARA || 'lajeado',
  NODE_OPTIONS: '--no-deprecation',
}
console.log(`• subindo next dev (CAMARA=${env.CAMARA})…`)
spawn('npx', ['next', 'dev', '-p', String(PORT)], { stdio: 'inherit', env, shell: true })
