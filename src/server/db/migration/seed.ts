import { sql } from 'drizzle-orm'
import { db } from '~/server/db'
import * as schema from './schema'

console.log('Seeding database...')

await db
  .insert(schema.botSourceStatuses)
  .values([
    { id: 1, name: 'Pending', createdAt: new Date() },
    { id: 2, name: 'In Progress', createdAt: new Date() },
    { id: 3, name: 'Completed', createdAt: new Date() },
    { id: 4, name: 'Failed', createdAt: new Date() },
    { id: 5, name: 'Crawling', createdAt: new Date() },
    { id: 6, name: 'Embedding', createdAt: new Date() },
  ])
  .onConflictDoUpdate({
    target: schema.botSourceStatuses.id,
    set: {
      name: sql`excluded.name`,
    },
  })

await db
  .insert(schema.botSourceTypes)
  .values([
    { id: 1, name: 'Link', visible: true, createdAt: new Date() },
    { id: 2, name: 'Sitemap', visible: true, createdAt: new Date() },
    {
      id: 3,
      name: 'SitemapExtractedData',
      visible: false,
      createdAt: new Date(),
    },
    { id: 4, name: 'File', visible: true, createdAt: new Date() },
    { id: 5, name: 'SitemapChildUrl', visible: true, createdAt: new Date() },
    { id: 6, name: 'SitemapFile', visible: true, createdAt: new Date() },
  ])
  .onConflictDoNothing()

await db
  .insert(schema.botModels)
  .values([
    { id: 1, name: 'GPT-3.5 turbo', createdAt: new Date() },
    { id: 2, name: 'GPT-4o Mini', createdAt: new Date() },
  ])
  .onConflictDoNothing()

await db
  .insert(schema.feedback_type)
  .values([
    { id: 1, name: 'Too long', createdAt: new Date() },
    { id: 2, name: 'Too short', createdAt: new Date() },
    { id: 3, name: 'Out of date', createdAt: new Date() },
    { id: 4, name: 'Inaccurate', createdAt: new Date() },
    { id: 5, name: 'Harmful or offensive', createdAt: new Date() },
    { id: 6, name: 'Not helpful', createdAt: new Date() },
    { id: 7, name: 'Correct', createdAt: new Date() },
    { id: 8, name: 'Easy to understand', createdAt: new Date() },
    { id: 9, name: 'Complete', createdAt: new Date() },
    { id: 10, name: 'Other positive', createdAt: new Date() },
    { id: 11, name: 'Other negative', createdAt: new Date() },
  ])
  .onConflictDoNothing()

console.log('Database seeded successfully!')
process.exit(0)
