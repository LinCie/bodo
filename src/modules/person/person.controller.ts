import { Controller } from '@/structures/Controller'
import { PersonService } from './person.service'
import type { Request, Response, NextFunction } from 'express'
import { partialPersonSchema, personSchema } from './person.schema'

class PersonController extends Controller {
  public readonly personService: PersonService

  constructor() {
    super()
    this.personService = new PersonService()

    this.bindRoutes([
      { method: 'get', path: '/', handler: this.index },
      { method: 'get', path: '/:id', handler: this.show },
      { method: 'post', path: '/', handler: this.create, schema: personSchema },
      {
        method: 'patch',
        path: '/:id',
        handler: this.update,
        schema: partialPersonSchema,
      },
      { method: 'delete', path: '/:id', handler: this.delete },
    ])
  }

  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, show = 10, search = '', searchBy = '' } = req.query
      const persons = await this.personService.getPersons(
        Number(page),
        Number(show),
        search as string,
        searchBy as string
      )
      return res.status(200).send(persons)
    } catch (error) {
      next(error)
    }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const person = await this.personService.getPerson(Number(id))
      return res.status(200).send(person)
    } catch (error) {
      next(error)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const person = await this.personService.createPerson(req.body)
      return res.status(201).send(person)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const person = await this.personService.updatePerson(Number(id), req.body)
      return res.status(201).send(person)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await this.personService.deletePerson(Number(id))
      return res.status(204).send
    } catch (error) {
      next(error)
    }
  }
}

export { PersonController }
