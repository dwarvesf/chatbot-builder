import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { botSources } from "~/migration/schema";
import { BotSourceTypeEnum } from "~/model/bot_source_type";
import { db } from "~/server/db";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const botSourceRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({
    botId: z.string(),
    // typeId: z.union([ z.literal(BotSourceTypeEnum.Link), z.literal(BotSourceTypeEnum.Sitemap) ]),
    typeId: z.nativeEnum(BotSourceTypeEnum),
    statusId: z.number(),
    url: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const botSource = await db.insert(botSources).values({
      ...input,
      id: uuidv4(),
      createdBy: ctx.session.user.id,
      createdAt: new Date(),
    }).returning();

    // TODO: Trigger or could fetch source here

    return botSource
  }),

  getByBotId: protectedProcedure.input(z.string()).query(async ({ input }) => {
    // TODO: Paging
    const arr = await db.query.botSources.findMany({
      where: eq(botSources.botId, input),
    });

    return arr;
  }),
})
