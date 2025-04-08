import { Service } from '@/structures/Service'
import type { z } from 'zod'
import type { partialPersonSchema, personSchema } from './person.schema'

class PersonService extends Service {
  getPersons(page: number, show: number) {
    return this.prisma.person.findMany({
      skip: page * show,
      take: show,
      orderBy: { id: 'asc' },
    })
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
