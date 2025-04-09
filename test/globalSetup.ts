import { app } from '@/server'
import { PORT } from '@/config/env.config'

const server = app.listen(PORT)
export default async () => {
  return () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
}
