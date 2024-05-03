import { db } from '~/server/db'
import * as schema from './schema'

console.log('Seeding database...')

await db.insert(schema.botSourceStatuses).values([
  {
    id: 1,
    name: 'Created',
    createdAt: new Date(),
  },
  {
    id: 2,
    name: 'In Progress',
    createdAt: new Date(),
  },
  {
    id: 3,
    name: 'Completed',
    createdAt: new Date(),
  },
  {
    id: 4,
    name: 'Failed',
    createdAt: new Date(),
  },
])

await db.insert(schema.botSourceTypes).values([
  {
    id: 1,
    name: 'Link',
    createdAt: new Date(),
  },
  {
    id: 2,
    name: 'Sitemap',
    createdAt: new Date(),
  },
])

console.log('Database seeded successfully!')
process.exit(0)
