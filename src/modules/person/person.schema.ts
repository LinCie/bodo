import { z } from 'zod'

const personSchema = z.object({
  number: z.string({
    required_error: 'number is required',
    invalid_type_error: 'number must be a string',
  }),

  username: z
    .string({
      required_error: 'username is required',
      invalid_type_error: 'username must be a string',
    })
    .regex(/^(?=[a-z0-9._]*[a-z])[a-z0-9._]+$/, {
      message:
        'username must contain only lowercase letters, numbers, underscores (_) or periods (.), and must include at least one letter',
    }),

  fullName: z
    .string({
      invalid_type_error: 'full name must be a string',
    })
    .optional()
    .refine(
      (val) => {
        if (val) {
          return /^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(val)
        }
        return true
      },
      {
        message:
          'Full name must only contain letters, spaces, apostrophes, or hyphens, and must start and end with a letter',
      }
    ),

  birthDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => (val ? new Date(val) : undefined)),

  deathDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => (val ? new Date(val) : undefined)),

  sex: z
    .string({
      invalid_type_error: 'sex must be a string',
    })
    .optional(),

  address: z
    .object({
      country: z
        .string({
          invalid_type_error: 'country must be a string',
        })
        .optional(),
      province: z
        .string({
          invalid_type_error: 'province must be a string',
        })
        .optional(),
      city: z
        .string({
          invalid_type_error: 'city must be a string',
        })
        .optional(),
      street: z
        .string({
          invalid_type_error: 'street must be a string',
        })
        .optional(),
      postal: z
        .string({
          invalid_type_error: 'postal code must be a string',
        })
        .optional(),
    })
    .optional(),

  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({
      message: "status must be either 'active' or 'inactive'",
    }),
  }),

  notes: z.string().optional(),
})

const partialPersonSchema = personSchema.partial()

export { personSchema, partialPersonSchema }
