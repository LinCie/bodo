import { execSync } from 'child_process'
import { afterAll, beforeAll } from 'vitest'
import supertest, { type Test } from 'supertest'
import type TestAgent from 'supertest/lib/agent'
import { app } from '@/server'
import { prisma } from '@/database/database'

let request: TestAgent<Test>

beforeAll(async () => {
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' })
  await prisma.$connect()
  request = supertest(app)
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { request }
