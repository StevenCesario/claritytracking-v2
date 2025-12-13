import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    /**
   * SERVER-SIDE VARIABLES
   * These are only available on the server.
   * If one tries to access them on the client (browser), the build will fail.
   */
    server: {
        DATABASE_URL: z.url(),
        CLERK_SECRET_KEY: z.string().min(1),
        STRIPE_SECRET_KEY: z.string().min(1),
        // Any other secret key is added here
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),
    },

    /**
   * CLIENT-SIDE VARIABLES
   * These are exposed to the browser.
   * They MUST start with `NEXT_PUBLIC_`.
   */
    client: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
        NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
        NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
    },

    /**
   * RUNTIME ENVIRONMENT
   * This is some "Next.js Magic" boilerplate.
   * You must manually destructure client variables here to ensure they 
   * are bundled correctly for the browser.
   */
    experimental__runtimeEnv: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    },

    /**
   * SKIP VALIDATION
   * Useful for Docker builds where you don't have secrets yet.
   */
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
    /**
   * EMPTY STRING AS UNDEFINED
   * Treats "KEY=" as missing.
   */
    emptyStringAsUndefined: true,
});