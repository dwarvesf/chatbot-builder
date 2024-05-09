import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/migration/schema'
import { db } from '~/server/db'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const botIntegrationRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ ctx, input }) => {
      const integrations = await db
        .select({
          id: schema.botIntegrations.id,
          apiToken: schema.botIntegrations.apiToken,
          botId: schema.botIntegrations.botId,
          createdAt: schema.botIntegrations.createdAt,
          embededToken: schema.botIntegrations.embededToken,
          whiteListIps: schema.botIntegrations.whiteListIps,
        })
        .from(schema.botIntegrations)
        .leftJoin(schema.bots, eq(schema.bots.id, schema.botIntegrations.botId))
        .where(
          and(
            eq(schema.bots.id, input.botId),
            eq(schema.bots.createdBy, ctx.session.user.id),
          ),
        )
      if (!integrations) {
        throw new Error('not found')
      }

      return integrations
    }),
})
