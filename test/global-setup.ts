import { execSync } from 'child_process'
import { prisma } from '@/database/database'

export default async () => {
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' })
  await prisma.$connect()

  return async () => {
    await prisma.$disconnect()
  }
}
