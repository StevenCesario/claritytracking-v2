import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
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