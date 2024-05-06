import { sql } from 'drizzle-orm'
import { db } from '~/server/db'

await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`)

process.exit(0)
