import type { NextFunction, Request, Response } from 'express'
import { FRONTEND_URL } from '@/config/env.config'
import { SESSION_EXPIRY_MS } from '@/config/shared.config'
import { AuthService } from '@/modules/auth'
import { ForbiddenError, UnauthorizedError } from '@/structures/Error'

async function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authService = new AuthService()

    if (req.method !== 'GET') {
      const origin = req.headers.origin
      if (origin === null || origin !== FRONTEND_URL) {
        throw new ForbiddenError('Origin mismatch')
      }
    }

    const { session } = req.cookies
    if (!session) {
      throw new UnauthorizedError('No session cookies was found')
    }

    const validated = await authService.validateSessionToken(session)
    if (!validated.session) {
      authService.deleteSessionTokenCookie(res)
      throw new UnauthorizedError(
        'There is an error while verifying session cookies'
      )
    }

    authService.setSessionTokenCookie(res, session, SESSION_EXPIRY_MS)

    req.user = validated.user
    next()
  } catch (error) {
    next(error)
  }
}

export { sessionMiddleware }
