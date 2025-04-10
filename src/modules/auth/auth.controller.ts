import type { NextFunction, Request, Response } from 'express'
import { Controller } from '@/structures/Controller'
import { BadRequestError } from '@/structures/Error'
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
      { method: 'delete', path: '/signout', handler: this.signout },
    ])
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = userSchema.safeParse(req.body)
      if (!validated.success) {
        throw new BadRequestError('Invalid email and/or password')
      }

      const session = await this.authService.signup(validated.data)
      this.authService.setSessionTokenCookie(
        res,
        session,
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      )

      return res.status(201).send()
    } catch (error) {
      next(error)
    }
  }

  async signin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = userSchema.safeParse(req.body)
      if (!validated.success) {
        throw new BadRequestError('Invalid email and/or password')
      }

      const session = await this.authService.signin(validated.data)
      if (session) {
        this.authService.setSessionTokenCookie(
          res,
          session,
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        )
        return res.status(200).send()
      }
    } catch (error) {
      next(error)
    }
  }

  async signout(req: Request, res: Response, next: NextFunction) {
    try {
      this.authService.deleteSessionTokenCookie(res)
      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}

export { AuthController }
