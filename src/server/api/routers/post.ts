import { z } from 'zod'

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc'
import { createCaller } from '../root'

let post = {
  id: 1,
  name: 'Hello World',
}

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      }
    }),

  protectedHello: protectedProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log('ctx', ctx)
      const p2 = await createCaller(ctx).post.protectedHello2({
        text: 'world2',
      })
      // const hello2 = api.post.protectedHello2
      console.log('p2', p2)

      return {
        greeting: `Hello ${input.text}`,
      }
    }),

  protectedHello2: protectedProcedure
    .input(z.object({ text: z.string() }))
    .query(({ ctx, input }) => {
      console.log('ctx', ctx)

      return {
        greeting: `Hello2 ${input.text}`,
      }
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      post = { id: post.id + 1, name: input.name }
      return post
    }),

  getLatest: protectedProcedure.query(() => {
    return post
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return 'you can now see this secret message!'
  }),
})
