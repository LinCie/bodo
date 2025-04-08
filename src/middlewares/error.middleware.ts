import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { NODE_ENV } from '@/config/env.config'
import { logger } from '@/config/logger.config'

function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (NODE_ENV === 'development') {
    logger.error(err)
  }

  if (!(err instanceof Error)) {
    res.status(500).send({ message: 'Unknown error occurred' })
    return
  }

  if (err instanceof ZodError) {
    res
      .status(400)
      .send({ message: err.message, errors: err.errors, cause: err.cause })
    return
  }

  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025':
        res.status(404).send({ message: err.message, meta: err.meta })
        break

      default:
        res.status(500).send({ message: 'Unknown database error occurred' })
        break
    }
  }

  switch (err.constructor.name) {
    case 'NotFoundError':
      res.status(404).send({ message: err.message })
      break

    case 'BadRequestError':
      res.status(400).send({ message: err.message })
      break

    case 'UnauthorizedError':
      res.status(401).send({ message: err.message })
      break

    case 'ForbiddenError':
      res.status(403).send({ message: err.message })
      break

    case 'UniqueConstraintError':
      res.status(409).send({ message: err.message })
      break

    default:
      res.status(500).send({ message: 'Internal Server Error' })
      break
  }
}

export { errorMiddleware }
