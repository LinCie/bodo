import { request } from 'test/setup'
import { expect, test, describe } from 'vitest'

describe('Auth Module', () => {
  test('should be able to signup', async () => {
    const res = await request
      .post('/auth/signup')
      .set('Content-Type', 'application/json')
      .send({ email: 'test@email.com', password: 'Password1234' })

    expect(res.status).toBe(201)
    console.log(res.body)
  })
})
