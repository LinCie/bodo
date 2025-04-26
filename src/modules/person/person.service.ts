import type { z } from 'zod'
import { Service } from '@/structures/Service'
import type { Prisma } from '@prisma/client'
import type { partialPersonSchema, personSchema } from './person.schema'

class PersonService extends Service {
  private getWhereInput(search: string, searchBy: string) {
    const where: Prisma.PersonWhereInput = {}

    if (search) {
      switch (searchBy) {
        case 'id':
          where.id = Number(search) || 0
          break
        case 'number':
          where.number = { contains: search }
          break
        case 'fullName':
          where.fullName = {
            contains: search,
          }
          break
        case 'username':
          where.username = {
            contains: search,
          }
          break
        default:
          where.OR = [
            { id: { equals: Number(search) || 0 } },
            { number: { contains: search } },
            {
              fullName: {
                contains: search,
              },
            },
            {
              username: {
                contains: search,
              },
            },
          ]
          break
      }
    }

    return where
  }

  async getPersons(
    page: number,
    show: number,
    search: string,
    searchBy: string
  ) {
    const where = this.getWhereInput(search, searchBy)

    const people = await this.prisma.person.findMany({
      skip: (page - 1) * show,
      take: show,
      orderBy: { id: 'asc' },
      where,
    })

    const count = await this.prisma.person.count({ where })

    return { people, count }
  }

  getPerson(id: number) {
    return this.prisma.person.findUniqueOrThrow({ where: { id } })
  }

  createPerson(data: z.infer<typeof personSchema>) {
    return this.prisma.person.create({ data })
  }

  updatePerson(id: number, data: z.infer<typeof partialPersonSchema>) {
    return this.prisma.person.update({ data, where: { id } })
  }

  deletePerson(id: number) {
    return this.prisma.person.delete({ where: { id } })
  }
}

export { PersonService }
