import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import * as schema from '~/migration/schema'
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
      const botId = uuidv7()
      const bot = await db
        .insert(schema.bots)
        .values({
          ...input,
          createdAt: new Date(),
          createdBy: ctx.session.user.id,
          userId: ctx.session.user.id,
          modelId: BotModelEnum.GPT3,
          id: botId,
        })
        .returning()

      // Create integration
      await db
        .insert(schema.botIntegrations)
        .values({
          id: uuidv7(),
          botId: botId,
          apiToken: uuidv7(),
        })
        .returning()

      return bot
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const bot = await db.query.bots.findFirst({
        where: and(
          eq(schema.bots.id, input),
          eq(schema.bots.createdBy, ctx.session.user.id),
        ),
      })
      return bot
    }),

  getList: protectedProcedure.query(async ({ ctx }) => {
    const bots = await db.query.bots.findMany({
      where: eq(schema.bots.createdBy, ctx.session.user.id),
    })
    return bots
  }),
})
