import { prisma } from '@/database/database'
import { faker } from '@faker-js/faker'
import * as argon2 from 'argon2'
import { request } from 'test/setup'

async function createFakeUser() {
  const fakeUser = {
    email: faker.internet.email(),
    password: faker.internet.password(),
  }

  const hash = await argon2.hash(fakeUser.password)
  const user = await prisma.user.create({
    data: { email: fakeUser.email, hash },
  })

  return { fakeUser, user }
}

async function getSessionCookie() {
  const { fakeUser } = await createFakeUser()

  const response = await request
    .post('/auth/signup')
    .set('Content-Type', 'application/json')
    .send(fakeUser)

  return response.headers['set-cookie']
}

export { getSessionCookie }
