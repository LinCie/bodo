import { describe, test, beforeEach, expect } from 'vitest'
import type { z } from 'zod'
import { request } from 'test/setup'
import { prisma } from '@/database/database'
import { getSessionCookie } from 'test/helpers/session'
import { faker } from '@faker-js/faker'
import type { personSchema } from '@/modules/person'
import { FRONTEND_URL } from '@/config/env.config'

const generatePersonPayload: () => z.infer<typeof personSchema> = () => {
  const username = faker.internet
    .username()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')

  return {
    username,
    number: faker.finance.accountNumber(),
    status: faker.helpers.arrayElement(['active', 'inactive']),
    fullName: faker.person.fullName(),
    birthDate: faker.date.past().toISOString(),
    deathDate: faker.date.future().toISOString(),
    sex: faker.person.gender(),
    address: {
      country: faker.location.country(),
      province: faker.location.state(),
      city: faker.location.city(),
      street: faker.location.streetAddress(),
      postal: faker.location.zipCode(),
    },
  }
}

describe('Person Routes E2E', async () => {
  const sessionCookie = (await getSessionCookie()) || ''

  beforeEach(async () => {
    await prisma.person.deleteMany()
  })

  describe('POST /people', () => {
    test('should create a new person and return 201 with the created person', async () => {
      const validPersonPayload = generatePersonPayload()

      const res = await request
        .post('/people')
        .set('Content-Type', 'application/json')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)
        .send(validPersonPayload)

      expect(res.status).toBe(201)
      expect(res.body).toEqual(expect.objectContaining(validPersonPayload))
      expect(res.body.id).toBeDefined()
    })

    test('should return 400 for invalid payload', async () => {
      const invalidPayload = {
        username: 'INVALID_USER',
        status: 'active',
      }

      const res = await request
        .post('/people')
        .set('Content-Type', 'application/json')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)
        .send(invalidPayload)

      expect(res.status).toBe(400)
    })
  })

  describe('GET /people', () => {
    beforeEach(async () => {
      const person1 = generatePersonPayload()
      const person2 = {
        ...generatePersonPayload(),
        username: faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, ''),
      }
      await prisma.person.createMany({
        data: [person1, person2],
      })
    })

    test('should return a list of persons', async () => {
      const res = await request
        .get('/people')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
    })

    test('should support pagination via query params', async () => {
      const res = await request
        .get('/people?page=0&show=1')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(1)
    })
  })

  describe('GET /people/:id', () => {
    test('should return a specific person by id', async () => {
      const validPersonPayload = generatePersonPayload()
      const created = await prisma.person.create({ data: validPersonPayload })

      const res = await request
        .get(`/people/${created.id}`)
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining(validPersonPayload))
    })

    test('should return 404 if the person does not exist', async () => {
      const nonExistentId = 999999
      const res = await request
        .get(`/people/${nonExistentId}`)
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /people/:id', () => {
    test('should update an existing person and return 201 with updated data', async () => {
      const validPersonPayload = generatePersonPayload()
      const created = await prisma.person.create({ data: validPersonPayload })

      const updateData = {
        status: faker.helpers.arrayElement(['active', 'inactive']),
        fullName: faker.person.fullName(),
      }

      const res = await request
        .patch(`/people/${created.id}`)
        .set('Content-Type', 'application/json')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)
        .send(updateData)

      expect(res.status).toBe(201)
      expect(res.body).toEqual(expect.objectContaining(updateData))
    })

    test('should return 400 for invalid update data', async () => {
      const validPersonPayload = generatePersonPayload()
      const created = await prisma.person.create({ data: validPersonPayload })

      const invalidUpdate = { status: 'unknown' }

      const res = await request
        .patch(`/people/${created.id}`)
        .set('Content-Type', 'application/json')
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)
        .send(invalidUpdate)

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /people/:id', () => {
    test('should delete an existing person and return 204', async () => {
      const validPersonPayload = generatePersonPayload()
      const created = await prisma.person.create({ data: validPersonPayload })

      const res = await request
        .delete(`/people/${created.id}`)
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(204)

      await expect(
        prisma.person.findUniqueOrThrow({ where: { id: created.id } })
      ).rejects.toThrow()
    })

    test('should return 404 when trying to delete a non-existent person', async () => {
      const nonExistentId = 999999
      const res = await request
        .delete(`/people/${nonExistentId}`)
        .set('Cookie', [...sessionCookie])
        .set('Origin', FRONTEND_URL)

      expect(res.status).toBe(404)
    })
  })
})
