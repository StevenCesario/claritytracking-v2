import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { z, ZodError } from "zod";

/**
 * 1. CONTEXT
 * This section defines the "Context" available to every API endpoint.
 * We attach the Database and the Current User (Clerk) here.
 */

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const session = await auth();

    return {
        db,
        session, 
        userId: session.userId,
        ...opts,
    };
};

/**
 * 2. INITIALIZATION
 * Initialize tRPC with the context created above.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError 
                        ? z.treeifyError(error.cause) // Zod v4
                        : null,
            },
        };
    },
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 * These are the building blocks of the API.
 */
export const createTRPCRouter = t.router;

// Public Procedure (Anyone can call this)
export const publicProcedure = t.procedure;

// Protected Procedure (Only logged-in users can call this; "get_current_user" dependency Python equivalent
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            // Infers the `session` as non-nullable
            session: { ...ctx.session, user: ctx.session },
            userId: ctx.userId,
        },
    });
});