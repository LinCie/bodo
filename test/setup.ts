import supertest from 'supertest'
import { app } from '@/server'

export const request = supertest(app)
