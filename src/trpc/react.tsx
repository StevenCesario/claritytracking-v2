"use client"; // For interactivity (hooks, state, button clicks etc.)

import { createTRPCReact } from "@trpc/react-query"; // The factory function
import { type AppRouter } from "@/server/api/root"; // The "shape" of our API

// Create a proxy that looks exactly like our backend
export const api = createTRPCReact<AppRouter>();