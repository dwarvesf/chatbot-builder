import { type Config } from 'drizzle-kit'

import { env } from '~/env'

export default {
  schema: './src/server/db/migration/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  // tablesFilter: ["chatbot-builder_*"],
  out: './src/server/db/migrations',
} satisfies Config
