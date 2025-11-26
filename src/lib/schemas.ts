import { z } from "zod";

// =============================================================================
// USER SCHEMAS
// =============================================================================

// "UserCreate" in Python
export const userCreateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// "UserResponse" in Python
export const userResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.email(),
    registeredAt: z.date(),
});

// =============================================================================
// WEBSITE & CONNECTION SCHEMAS
// =============================================================================

// "ConnectionBase" & "ConnectionCreate"
export const connectionCreateSchema = z.object({
    platform: z.enum(["meta", "shopify", "tiktok"]), // Enforce allowed platforms
    platformIdentifiers: z.record(z.string(), z.any()), // Dict[str, Any] -> Record<string, any>
});

export const connectionResponseSchema = connectionCreateSchema.extend({
    id: z.number(),
    isActive: z.boolean(),
    createdAt: z.date(),
});

// "WebsiteBase" & "WebsiteCreate"
export const websiteCreateSchema = z.object({
    url: z.url("Must be a valid URL"),
    name: z.string().min(1, "Name is required"),
});

export const websiteResponseSchema = websiteCreateSchema.extend({
    id: z.number(),
    userId: z.number(), // or string if Clerk ID
    createdAt: z.date(),
    connections: z.array(connectionResponseSchema).default([]),
});

// =============================================================================
// DASHBOARD & EVENT SCHEMAS
// =============================================================================

// "EventHealth"
export const eventHealthSchema = z.object({
    eventName: z.string(),
    emqScore: z.number().min(0).max(10),
    lastReceived: z.date(),
    status: z.enum(["healhty", "warning", "error"]),
});

// "EventAlert"
export const eventAlertSchema = z.object({
    id: z.string(),
    severity: z.enum(["error", "warning", "info"]),
    title: z.string(),
    message: z.string(),
    timestamp: z.date(),
});

// "DashboardResponse"
export const dashboardResponseSchema = z.object({
  totalConversionsRecovered: z.number().int().nonnegative(),
  overallRoas: z.number(),
  campaignPerformance: z.array(z.record(z.string(), z.any())), // List[Dict[str, Any]]
  eventHealthMonitor: z.array(eventHealthSchema),
});

// =============================================================================
// TYPE INFERENCE (The Magic Part)
// =============================================================================

// This replaces having to write "class UserCreate..." separately.
// TypeScript calculates the type FROM the Zod schema.
export type UserCreate = z.infer<typeof userCreateSchema>;
export type WebsiteResponse = z.infer<typeof websiteResponseSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;