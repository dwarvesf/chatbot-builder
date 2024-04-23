import { eq } from "drizzle-orm";
import { z } from "zod";
import { bots } from "~/migration/schema";

import {
  createTRPCRouter,
  protectedProcedure
} from "~/server/api/trpc";
import { db } from "~/server/db";

let post = {
  id: 1,
  name: "Hello World",
};

export const botRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // TODO: implement later: Create a bot
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      post = { id: post.id + 1, name: input.name };
      return post;
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
