import { pgTable, serial, integer, text, timestamp, boolean, jsonb, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

// UPDATE: Enums for strict typing
export const connectionTypeEnum = pgEnum("connection_type", ["source", "destination"]);
export const processingStatusEnum = pgEnum("processing_status", ["pending", "processing", "failed", "duplicate"]);

// =============================================================================
// 1. USERS (Auth Layer)
// =============================================================================
// In v2.0 with Clerk, we don't strictly *need* a users table for auth,
// but it is crucial for tying our data (Websites) to a specific identity.
// We store the 'clerkId' to link the two systems.

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").unique().notNull(), // The link to Clerk
    email: text("email").notNull(),
    name: text("name"),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),

    // UPDATE: "The Concierge Build" - we might need a flag for "concierge_onboarding_complete" later
    isOnboarded: boolean("is_onboarded").default(false),
}, (table) => [
    index("clerk_id_idx").on(table.clerkId), // Speed up lookups by Clerk ID
]);

// =============================================================================
// 2. WEBSITES (The "Store Context")
// =============================================================================

export const websites = pgTable("websites", {
    id: serial("id").primaryKey(),
    // We refer to our own internal user ID, not the Clerk ID, for foreign keys
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    url: text("url").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // UPDATE: These two are essential for "Real Revenue" reporting
    currency: text("currency").default("USD").notNull(),
    timezone: text("timezone").default("UTC").notNull(),
}, (table) => [
    index("user_id_idx").on(table.userId), // Speed up lookups to User ID
]);

// =============================================================================
// 3. CONNECTIONS (Sources & Destinations)
// =============================================================================

// "Our open architecture adopts to YOU"
export const connections = pgTable("connections", {
    id: serial("id").primaryKey(),
    websiteId: integer("website_id").references(() => websites.id, { onDelete: "cascade" }),

    platform: text("platform").notNull(), // "meta", "shopify", "tiktok" (Future Phase 2)
    type: connectionTypeEnum("type").notNull(), // Is this an input (Shopify) or output (Meta)?

    // Stores platform specific config. 
    // For Meta: { pixelId: "123", testCode: "TEST1234" }
    // For Shopify: { shopUrl: "QK-123.myshopify.com" }
    config: jsonb("config").default({}).notNull(), // Equivalent to mapped_column(JSON)

    encryptedAccessToken: text("encrypted_access_token"), // We need to make sure to encrypt this

    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("website_id_idx").on(table.websiteId),
]);

// =============================================================================
// 4. EVENT LOGS (The Universal Data Layer)
// =============================================================================

// "We ingest Shopify webhooks... hash/clean... push to CAPI"
export const eventLogs = pgTable("event_logs", {
    id: serial("id").primaryKey(),
    websiteId: integer("website_id").references(() => websites.id, { onDelete: "cascade" }),

    // The Dedup Key. "Meta's events from server are not deduplicated" fix
    eventId: text("event_id").notNull(),
    eventName: text("event_name").notNull(), // "Purchase", "AddToCart" etc.

    // URL where it happened (Source)
    eventSourceUrl: text("event_source_url"),

    // PII & Matching Data (Hashed where applicable)
    // "We sent Email + IP + User Agent, so your score is likely 8.5"
    userIpAddress: text("user_ip_address"),
    userAgent: text("user_agent"),
    fbp: text("fbp"), // Browser ID
    fbc: text("fbc"), // Click ID
    hashedEmail: text("hashed_email"), // SHA256
    hashedPhone: text("hashed_phone"), // SHA256

    // Purhcase Data
    value: text("value"), // Stored as string to avoid floating point math errors
    currency: text("currency"),

    // Processing Logic
    status: processingStatusEnum("status").default("pending").notNull(),
    // Store the API response from Meta for debugging "Great Match Quality"
    platformResponse: jsonb("platform_response"),
    // Store raw Shopify payload to allow replay if we mess up hashing logic
    originalPayload: jsonb("original_payload"),
    matchQualityScore: text("match_quality_score"),

    // Timestamps
    receivedAt: timestamp("received_at").defaultNow().notNull(), // When we got the webhook
    eventTime: timestamp("event_time").notNull(), // When the user actually clicked
}, (table) => [
    index("log_website_id_idx").on(table.websiteId),
    index("log_event_id_idx").on(table.eventId), // For deduplication
    index("log_event_name_idx").on(table.eventName),

    // UPDATE: Critical for "Smart Deduplication". 
    // This ensures we never double-count the same event ID for a single store
    uniqueIndex("unique_event_id_per_site").on(table.websiteId, table.eventId),
]);

// =============================================================================
// TYPE INFERENCE
// =============================================================================

export type User = InferSelectModel<typeof users>;
export type Website = InferSelectModel<typeof websites>;
export type Connection = InferSelectModel<typeof connections>;
export type EventLog = InferSelectModel<typeof eventLogs>;

export type NewUser = InferInsertModel<typeof users>;
export type NewWebsite = InferInsertModel<typeof websites>;
export type NewConnection = InferInsertModel<typeof connections>;
export type NewEventLog = InferInsertModel<typeof eventLogs>;