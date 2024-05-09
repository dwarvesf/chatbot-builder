import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/migration/schema'
import { db } from '~/server/db'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botIntegrationRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bot = await db.query.bots.findFirst({
        where: and(
          eq(schema.bots.id, input.botId),
          eq(schema.bots.createdBy, ctx.session.user.id),
        ),
      })
      if (!bot) {
        throw new Error('not found')
      }

      const integrations = await db.query.botIntegrations.findMany({
        where: eq(schema.botIntegrations.botId, bot.id),
      })

      return integrations
    }),
})
