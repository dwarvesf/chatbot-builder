import { and, eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'
import { BotStatusEnum } from '~/model/bot'
import { BotModelEnum } from '~/model/bot-model'
import { UsageLimitTypeEnum } from '~/model/usage-limit-type'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { db } from '~/server/db'
import * as schema from '~/server/db/migration/schema'

export const botRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        description: z.string().default(''),
        companyLogoAttachmentId: z.string().optional(),
        botAvatarAttachmentId: z.string().optional(),
        chatBubbleIconId: z.number().optional(),
        accentColour: z.string().optional(),
        subheading: z.string().optional(),
        welcomeMsg: z.string().optional(),
        inputBoxPlaceholder: z.string().optional(),
        showBrandingOnWidget: z.string().optional(),
        widgetPosition: z.number().optional(),
        widgetName: z.string().min(1).max(50),
        widgetSubheading: z.string().default('Our bot answers instantly'),
        widgetPlaceholder: z.string().default('Send a message...'),
        widgetWelcomeMsg: z.string().default('Hey there, how can I help you'),
        showSourceWithResponse: z.string().optional(),
        postChatFeedback: z.string().optional(),
        widgetOpenDefault: z.string().optional(),
        showFloatingWelcomeMsg: z.string().optional(),
        showFloatingStarterQuestions: z.string().optional(),
        uploadedChars: z.number().optional(),
        maxChars: z.number().optional(),
        maxMsgCount: z.number().optional(),
        msgCount: z.number().optional(),
        modelId: z.nativeEnum(BotModelEnum).default(BotModelEnum.GPT3),
        multiLanguagesSupport: z.string().optional(),
        responseLength: z.number().optional(),
        sendEmailTranscript: z.string().optional(),
        suggestFollowupQuestions: z.string().optional(),
        customization: z.string().optional(),
        usageLimitPerUser: z.number().default(50),
        usageLimitPerUserType: z
          .nativeEnum(UsageLimitTypeEnum)
          .default(UsageLimitTypeEnum.PerDay),
        userLimitWarningMsg: z
          .string()
          .default(`You've reached the message limit.`),
        noSourceWarningMsg: z
          .string()
          .default(
            'The bot still needs to be trained, so please add the data and train it.',
          ),
        serverErrorMsg: z
          .string()
          .default('Apologies, there seems to be a server error.'),
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
          status: BotStatusEnum.Active,
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

  updateBotSettings: protectedProcedure
    .input(
      z.object({
        botId: z.string(),
        name: z.string().min(1),
        description: z.string(),
        noSourceWarningMsg: z.string(),
        serverErrorMsg: z.string(),
        userLimitWarningMsg: z.string(),
        noRelevantContextMsg: z.string(),
        usageLimitPerUser: z.number(),
        usageLimitPerUserType: z.nativeEnum(UsageLimitTypeEnum),
        modelId: z.nativeEnum(BotModelEnum),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const bot = await db
        .update(schema.bots)
        .set({
          name: input.name,
          description: input.description,
          modelId: input.modelId,
          noSourceWarningMsg: input.noSourceWarningMsg,
          serverErrorMsg: input.serverErrorMsg,
          userLimitWarningMsg: input.userLimitWarningMsg,
          noRelevantContextMsg: input.noRelevantContextMsg,
          usageLimitPerUser: input.usageLimitPerUser,
          usageLimitPerUserType: input.usageLimitPerUserType,
          updatedAt: new Date(),
          updatedBy: ctx.session.user.id,
        })
        .where(
          and(
            eq(schema.bots.id, input.botId),
            eq(schema.bots.createdBy, ctx.session.user.id),
          ),
        )
        .returning()

      return bot
    }),

  updateBotAppearance: protectedProcedure
    .input(
      z.object({
        companyLogoAttachmentId: z.string().nullable(),
        botAvatarAttachmentId: z.string().nullable(),
        botId: z.string(),
        widgetName: z.string().min(1).max(50),
        widgetSubheading: z.string(),
        widgetPlaceholder: z.string(),
        widgetWelcomeMsg: z.string(),
        accentColour: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.companyLogoAttachmentId === '') {
        input.companyLogoAttachmentId = null
      }
      if (input.botAvatarAttachmentId === '') {
        input.botAvatarAttachmentId = null
      }

      const bot = await db
        .update(schema.bots)
        .set({
          companyLogoAttachmentId: input.companyLogoAttachmentId,
          botAvatarAttachmentId: input.botAvatarAttachmentId,
          widgetName: input.widgetName,
          widgetSubheading: input.widgetSubheading,
          widgetPlaceholder: input.widgetPlaceholder,
          widgetWelcomeMsg: input.widgetWelcomeMsg,
          accentColour: input.accentColour,
          updatedAt: new Date(),
          updatedBy: ctx.session.user.id,
        })
        .where(
          and(
            eq(schema.bots.id, input.botId),
            eq(schema.bots.createdBy, ctx.session.user.id),
          ),
        )
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
      where: and(
        eq(schema.bots.createdBy, ctx.session.user.id),
        eq(schema.bots.status, BotStatusEnum.Active),
      ),
    })
    return bots
  }),

  archive: protectedProcedure
    .input(z.object({ botID: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await db.query.bots.findFirst({
        where: and(
          eq(schema.bots.id, input.botID),
          eq(schema.bots.createdBy, ctx.session.user.id),
        ),
      })
      if (!bot) {
        throw new Error('Bot not found')
      }

      const updatedBot = await db
        .update(schema.bots)
        .set({
          status: BotStatusEnum.Archived,
          updatedAt: new Date(),
        })
        .where(eq(schema.bots.id, input.botID))
        .returning()

      return updatedBot
    }),
})
