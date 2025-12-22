import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),
  NODE_ENV: z.string(),
  RESEND_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3333)
})

export const env = envSchema.parse(process.env)