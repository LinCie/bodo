import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { FRONTEND_URL } from '@/config/env.config'
import { logger } from '@/config/logger.config'
import { errorMiddleware } from '@/middlewares/error.middleware'
import { sessionMiddleware } from '@/middlewares/session.middleware'
import { AuthController } from '@/modules/auth/'
import { PersonController } from './modules/person'

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
  .use(cors({ origin: FRONTEND_URL, credentials: true }))
  .use(cookieParser())
  .use(express.json())

// Regular Routes
app
  // Index
  .get('/', (req, res) => {
    res.send('Hello World!')
  })
  // Auth
  .use('/auth', new AuthController().router)

// Protected Routes
app.use(sessionMiddleware).use('/people', new PersonController().router)

// After request middlewares
app.use(errorMiddleware)

export { app }
