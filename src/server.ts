import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { PORT } from '@/config/env.config'
import { logger } from './config/logger.config'

const app = express()

// Before request middlewares
app
  .use(
    morgan('tiny', {
      stream: {
        write: (message) => {
          logger.info(message.trim())
        },
      },
    })
  )
  .use(helmet())
  .use(cors())
  .use(express.json())

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// After request middlewares

app.listen(PORT, () => {
  logger.info(`Server is listening to port ${PORT} 🦊`)
})
