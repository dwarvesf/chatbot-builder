import { eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~/server/db/migration/schema'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'

export const userRouter = createTRPCRouter({
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db
        .update(schema.users)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          updatedAt: new Date(),
          updatedBy: ctx.session.user.id,
        })
        .where(eq(schema.users.id, ctx.session.user.id))
        .returning()

      return user
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, ctx.session.user.id),
    })
    return user
  }),
})
