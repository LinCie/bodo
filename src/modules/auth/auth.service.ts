import type { z } from 'zod'
import * as argon2 from 'argon2'
import { Service } from '@/structures/Service'
import type { userSchema } from './auth.schema'

class AuthService extends Service {
  constructor() {
    super()
  }

  async signup(body: z.infer<typeof userSchema>) {
    const hash = await argon2.hash(body.password)
    const newUser = await this.prisma.user.create({
      data: { hash, email: body.email },
    })
    return newUser
  }
}

export { AuthService }
