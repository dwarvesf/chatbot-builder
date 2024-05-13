import { db } from '~/server/db'
import * as schema from './schema'

console.log('Seeding database...')

await db
  .insert(schema.botSourceStatuses)
  .values([
    { id: 1, name: 'Created', createdAt: new Date() },
    { id: 2, name: 'In Progress', createdAt: new Date() },
    { id: 3, name: 'Completed', createdAt: new Date() },
    { id: 4, name: 'Failed', createdAt: new Date() },
    { id: 5, name: 'Crawling', createdAt: new Date() },
    { id: 6, name: 'Embedding', createdAt: new Date() },
  ])
  .onConflictDoNothing()

await db
  .insert(schema.botSourceTypes)
  .values([
    { id: 1, name: 'Link', visible: true, createdAt: new Date() },
    { id: 2, name: 'Sitemap', visible: true, createdAt: new Date() },
    { id: 3, name: 'SitemapChild', visible: false, createdAt: new Date() },
  ])
  .onConflictDoNothing()

await db
  .insert(schema.botModels)
  .values([{ id: 1, name: 'GPT-3.5 turbo', createdAt: new Date() }])
  .onConflictDoNothing()

console.log('Database seeded successfully!')
process.exit(0)
