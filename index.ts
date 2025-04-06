import { PORT } from '@/config/env.config'
import { logger } from '@/config/logger.config'
import { app } from '@/server'

app.listen(PORT, () => {
  logger.info(`Server is listening to port ${PORT} 🦊`)
})
