import express from 'express'
import type { Request, Response, NextFunction } from 'express'

interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  handler: (req: Request, res: Response, next: NextFunction) => void
}

abstract class Controller {
  public readonly router = express.Router()

  protected bindRoutes(routes: RouteDefinition[]): void {
    routes.forEach((route) => {
      this.router[route.method](route.path, route.handler.bind(this))
    })
  }
}

export { Controller }
export type { RouteDefinition }
