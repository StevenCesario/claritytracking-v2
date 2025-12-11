import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { users } from "@/db/schema";

export const exampleRouter = createTRPCRouter({
    // 1. A Public "Hello World" (No Login Required)
    hello: publicProcedure
        .input(z.object({ text: z.string() }))
        .query(({ input }) => {
            return {
                greeting: `Hello ${input.text}, welcome to ClarityTracking v2!`,
            };
        }),

    // 2. A Protected DB Query (Must be logged in via Clerk)
    getSecretMessage: protectedProcedure.query(async ({ ctx }) => {
        // We can access ctx.userId here because 'protectedProcedure' guarantees it!
        return "You are logged in! Your user ID is " + ctx.userId;
    }),

    // 3. A DB Mutation (Writing data)
    // This is just a test to prove Drizzle works
    createTestUser: protectedProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            // Drizzle Magic
            await ctx.db.insert(users).values({
                email: input.email,
                clerkId: ctx.userId,
                name: "Test User"
            });
            return { success: true };
        }),
});