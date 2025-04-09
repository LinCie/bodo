import { app } from '@/server'
import { execSync } from 'child_process'
import http from 'http'

const server = http.createServer(app)

export default async () => {
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' })

  return async () => {
    await new Promise<void>((resolve) => {
      resolve()
    })
  }
}

export { server }
