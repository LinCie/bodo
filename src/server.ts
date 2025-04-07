import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { logger } from '@/config/logger.config'
import { errorMiddleware } from '@/middlewares/error.middleware'
import { AuthController } from '@/modules/auth/'

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
  .use(cookieParser())
  .use(express.json())

// Routes
app
  // Index
  .get('/', (req, res) => {
    res.send('Hello World!')
  })
  // Auth
  .use('/auth', new AuthController().router)

// After request middlewares
app.use(errorMiddleware)

export { app }
