import { beforeAll } from 'vitest'
import supertest, { Test } from 'supertest'
import type TestAgent from 'supertest/lib/agent'
import { server } from './global-setup'

let request: TestAgent<Test>

beforeAll(async () => {
  request = supertest(server)
})

export { request }
