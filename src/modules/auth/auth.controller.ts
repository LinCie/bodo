import type { Request, Response } from 'express'
import { Controller } from '@/structures/Controller'
import { AuthService } from './auth.service'
import { userSchema } from './auth.schema'

class AuthController extends Controller {
  public readonly authService: AuthService

  constructor() {
    super()
    this.authService = new AuthService()

    this.bindRoutes([
      { method: 'post', path: '/signup', handler: this.signup },
      { method: 'post', path: '/signin', handler: this.signin },
    ])
  }

  async signup(req: Request, res: Response) {
    const validated = userSchema.safeParse(req.body)
    if (!validated.success) {
      res.status(400)
      return res.send(validated.error.errors)
    }

    const session = await this.authService.signup(validated.data)
    this.authService.setSessionTokenCookie(
      res,
      session,
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    )

    res.status(201)
    res.send()
  }

  async signin(req: Request, res: Response) {
    const validated = userSchema.safeParse(req.body)
    if (!validated.success) {
      res.status(400)
      return res.send(validated.error.errors)
    }

    const session = await this.authService.signin(validated.data)
    if (session) {
      this.authService.setSessionTokenCookie(
        res,
        session,
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      )
      res.status(201)
      return res.send()
    }

    res.status(404)
    res.send()
  }
}

export { AuthController }
