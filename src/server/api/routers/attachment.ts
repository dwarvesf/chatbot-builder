import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { AttachmentType } from '~/model/attachment'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'

export const attachmentRouter = createTRPCRouter({
  createBlobURL: protectedProcedure
    .input(
      z.object({
        cloudPath: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const attachmentId = uuidv7()
      await db
        .insert(schema.attachments)
        .values({
          id: attachmentId,
          typeId: AttachmentType.BLOB,
          cloudPath: input.cloudPath,
          userId: ctx.session.user.id,
          createdAt: new Date(),
          createdBy: ctx.session.user.id,
        })
        .returning()

      return {
        attachmentId,
      }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const attachment = await db.query.attachments.findFirst({
        where: and(
          eq(schema.attachments.id, input),
          eq(schema.attachments.createdBy, ctx.session.user.id),
        ),
      })
      return attachment
    }),
})
