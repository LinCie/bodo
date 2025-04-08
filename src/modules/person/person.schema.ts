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
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ]+([ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/, {
      message:
        'full name must only contain letters, spaces, apostrophes, or hyphens, and must start and end with a letter',
    })
    .optional(),

  birthDate: z
    .string({
      invalid_type_error: 'birth date must be a string',
    })
    .datetime({
      message:
        'birth date must be a valid ISO 8601 datetime string (e.g., 1990-01-01T00:00:00.000Z)',
    })
    .optional(),

  deathDate: z
    .string({
      invalid_type_error: 'death date must be a string',
    })
    .datetime({
      message:
        'death date must be a valid ISO 8601 datetime string (e.g., 2077-01-01T00:00:00.000Z)',
    })
    .optional(),

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
})

const partialPersonSchema = personSchema.partial()

export { personSchema, partialPersonSchema }
