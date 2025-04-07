import { expect, test, describe, beforeEach, beforeAll } from 'vitest'
import { faker } from '@faker-js/faker'
import * as argon2 from 'argon2'
import { request } from 'test/setup'
import { prisma } from '@/database/database'

const fakeUser = {
  email: faker.internet.email(),
  password: faker.internet.password(),
}

describe('Auth Module', () => {
  describe('Signup Route', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany()
    })

    test('should return 201 on successful signup', async () => {
      const res = await request
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send(fakeUser)

      expect(res.status).toBe(201)
    })

    test('should set header on successful signup', async () => {
      const res = await request
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send(fakeUser)

      expect(res.headers['set-cookie']).toBeDefined()
    })

    test('should return 409 if email is already taken', async () => {
      const hash = await argon2.hash(fakeUser.password)
      await prisma.user.create({ data: { email: fakeUser.email, hash } })

      const res = await request
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send(fakeUser)

      expect(res.status).toBe(409)
    })

    test('should return 400 during bad request', async () => {
      const badUsers = [
        // Empty email and password
        { email: '', password: '' },

        // Missing email, valid-looking password
        {
          email: '',
          password: faker.internet.password(),
        },

        // Malformed email (no @)
        {
          email: 'malformedemail',
          password: faker.internet.password({ length: 12 }),
        },

        // Malformed email (no TLD)
        {
          email: 'malformed@email',
          password: faker.internet.password({ length: 12 }),
        },

        // Malformed email (short TLD)
        {
          email: 'malformed@email.c',
          password: faker.internet.password({ length: 12 }),
        },

        // Valid email, empty password
        { email: faker.internet.email(), password: '' },

        // Valid email, whitespace password
        { email: faker.internet.email(), password: '           ' },

        // Valid email, password too short
        {
          email: faker.internet.email(),
          password: faker.string.alpha({ length: 2 }),
        },

        // Valid email, only numbers
        { email: faker.internet.email(), password: faker.string.numeric(4) },

        // Valid email, missing number/symbol
        {
          email: faker.internet.email(),
          password: faker.string.alpha({ length: 8, casing: 'mixed' }),
        },
      ]

      for (const user of badUsers) {
        const res = await request
          .post('/auth/signup')
          .set('Content-Type', 'application/json')
          .send(user)

        expect(res.status).toBe(400)
      }
    })
  })

  describe('Signin Route', () => {
    beforeAll(async () => {
      const hash = await argon2.hash(fakeUser.password)
      await prisma.user.create({ data: { email: fakeUser.email, hash } })
    })

    test('should return 200 on successful signin', async () => {
      const res = await request
        .post('/auth/signin')
        .set('Content-Type', 'application/json')
        .send(fakeUser)

      expect(res.status).toBe(200)
    })

    test('should set header on successful signin', async () => {
      const res = await request
        .post('/auth/signin')
        .set('Content-Type', 'application/json')
        .send(fakeUser)

      expect(res.headers['set-cookie']).toBeDefined()
    })

    test('should return 400 if password mismatch', async () => {
      const res = await request
        .post('/auth/signin')
        .set('Content-Type', 'application/json')
        .send({
          email: fakeUser.email,
          password: faker.string.alpha({ length: 4 }),
        })

      expect(res.status).toBe(400)
    })

    test('should return 404 if user does not exist', async () => {
      const res = await request
        .post('/auth/signin')
        .set('Content-Type', 'application/json')
        .send({
          email: faker.internet.email(),
          password: faker.internet.password(),
        })

      expect(res.status).toBe(404)
    })
  })
})
