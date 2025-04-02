import type { Request, Response } from 'express'
import { Controller } from '@/structures/Controller'
import { AuthService } from './auth.service'
import { userSchema } from './auth.schema'

class AuthController extends Controller {
  public readonly authService: AuthService

  constructor() {
    super()
    this.authService = new AuthService()

    this.bindRoutes([{ method: 'post', path: '/signup', handler: this.signup }])
  }

  async signup(req: Request, res: Response) {
    const validated = userSchema.safeParse(req.body)
    if (!validated.success) {
      res.status(400)
      return res.send(validated.error.errors)
    }

    const user = await this.authService.signup(validated.data)

    return res.send(user)
  }
}

export { AuthController }
