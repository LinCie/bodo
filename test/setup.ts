import { execSync } from 'child_process'
import { afterAll, beforeAll } from 'vitest'
import supertest, { type Test } from 'supertest'
import type TestAgent from 'supertest/lib/agent'
import type { Server, IncomingMessage, ServerResponse } from 'http'
import { app } from '@/server'
import { prisma } from '@/database/database'
import { PORT } from '@/config/env.config'

let server: Server<typeof IncomingMessage, typeof ServerResponse>
let request: TestAgent<Test>

beforeAll(async () => {
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' })
  server = app.listen(PORT)
  request = supertest(app)
})

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
  }

  await prisma.$disconnect()
})

export { request }
