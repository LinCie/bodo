import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email('Email must be a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    ),
})

export { userSchema }
