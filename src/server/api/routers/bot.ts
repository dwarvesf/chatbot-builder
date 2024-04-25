import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { bots } from "~/migration/schema";

import {
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const botRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1),
      description: z.string(),
      companyLogoAttachmentId: z.string(),
      botAvatarAttachmentId: z.string(),
      chatBubbleIconId: z.number(),
      accentColour: z.string(),
      subheading: z.string(),
      welcomeMsg: z.string(),
      inputBoxPlaceholder: z.string(),
      showBrandingOnWidget: z.string(),
      widgetPosition: z.number(),
      showSourceWithResponse: z.string(),
      postChatFeedback: z.string(),
      widgetOpenDefault: z.string(),
      showFloatingWelcomeMsg: z.string(),
      showFloatingStarterQuestions: z.string(),
      uploadedChars: z.number(),
      maxChars: z.number(),
      maxMsgCount: z.number(),
      msgCount: z.number(),
      modelId: z.number(),
      multiLanguagesSupport: z.string(),
      responseLength: z.number(),
      sendEmailTranscript: z.string(),
      suggestFollowupQuestions: z.string(),
      customization: z.string(),
      usageLimitPerUser: z.number(),
      usageLimitPerUserType: z.number(),
      userLimitWarningMsg: z.string(),
      whileListIpsOnly: z.string(),
    }))
    .mutation(async ({ input }) => {
      const bot = await db.insert(bots).values({
        ...input,
        createdAt: new Date(),
        userId: '1',
        id: uuidv4(),
      }).returning();

      return bot
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
    const bot = await db.query.bots.findFirst({
      where: eq(bots.id, input),
    });
    return bot;
  }),

  getList: protectedProcedure.query(async () => {
    // TODO: Implement later: Filter + pagination
    const bots = await db.query.bots.findMany();
    return bots;
  }),
});
