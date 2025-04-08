import { validatorMiddleware } from '@/middlewares/validator.middleware'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import type { ZodTypeAny } from 'zod'

interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  handler: (req: Request, res: Response, next: NextFunction) => void
  schema?: ZodTypeAny
}

abstract class Controller {
  public readonly router = express.Router()

  protected bindRoutes(routes: RouteDefinition[]): void {
    routes.forEach((route) => {
      if (route.schema) {
        this.router[route.method](
          route.path,
          validatorMiddleware(route.schema),
          route.handler.bind(this)
        )
      } else {
        this.router[route.method](route.path, route.handler.bind(this))
      }
    })
  }
}

export { Controller }
export type { RouteDefinition }
