import { prisma } from '@/database/database'

abstract class Service {
  public readonly prisma = prisma
}

export { Service }
