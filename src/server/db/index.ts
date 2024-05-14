import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { type Logger } from 'drizzle-orm'
import { env } from '~/env'
import * as schema from './migration/schema'

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL)
if (env.NODE_ENV !== 'production') globalForDb.conn = conn

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ query, params })
  }
}

export const db = drizzle(conn, {
  schema,
  // logger: new MyLogger()
})
