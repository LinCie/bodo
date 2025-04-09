import { app } from '@/server'
import { PORT } from '@/config/env.config'
import { logger } from '@/config/logger.config'

app.listen(PORT, () => {
  logger.info(`Server is listening to port ${PORT} 🦊`)
})
