import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { bots } from '~/migration/schema'
import { BotModelEnum } from '~/model/bot-model'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'

export const botRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        companyLogoAttachmentId: z.string().optional(),
        botAvatarAttachmentId: z.string().optional(),
        chatBubbleIconId: z.number().optional(),
        accentColour: z.string().optional(),
        subheading: z.string().optional(),
        welcomeMsg: z.string().optional(),
        inputBoxPlaceholder: z.string().optional(),
        showBrandingOnWidget: z.string().optional(),
        widgetPosition: z.number().optional(),
        showSourceWithResponse: z.string().optional(),
        postChatFeedback: z.string().optional(),
        widgetOpenDefault: z.string().optional(),
        showFloatingWelcomeMsg: z.string().optional(),
        showFloatingStarterQuestions: z.string().optional(),
        uploadedChars: z.number().optional(),
        maxChars: z.number().optional(),
        maxMsgCount: z.number().optional(),
        msgCount: z.number().optional(),
        modelId: z.nativeEnum(BotModelEnum).optional(),
        multiLanguagesSupport: z.string().optional(),
        responseLength: z.number().optional(),
        sendEmailTranscript: z.string().optional(),
        suggestFollowupQuestions: z.string().optional(),
        customization: z.string().optional(),
        usageLimitPerUser: z.number().optional(),
        usageLimitPerUserType: z.number().optional(),
        userLimitWarningMsg: z.string().optional(),
        whileListIpsOnly: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bot = await db
        .insert(bots)
        .values({
          ...input,
          createdAt: new Date(),
          userId: ctx.session.user.id,
          id: uuidv4(),
        })
        .returning()

      return bot
    }),

  getById: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const bot = await db.query.bots.findFirst({
      where: eq(bots.id, input),
    })
    return bot
  }),

  getList: protectedProcedure.query(async () => {
    // TODO: Implement later: Filter + pagination
    const bots = await db.query.bots.findMany()
    return bots
  }),
})
