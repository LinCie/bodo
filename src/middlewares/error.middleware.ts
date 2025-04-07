import { NODE_ENV } from '@/config/env.config'
import { logger } from '@/config/logger.config'
import type { NextFunction, Request, Response } from 'express'

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
