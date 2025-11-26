import { pgTable, serial, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

// =============================================================================
// 1. USERS TABLE
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
}, (table) => [
    index("clerk_id_idx").on(table.clerkId), // Speed up lookups by Clerk ID
]);

// =============================================================================
// 2. WEBSITES TABLE
// =============================================================================

export const websites = pgTable("websites", {
    id: serial("id").primaryKey(),
    // We refer to our own internal user ID, not the Clerk ID, for foreign keys
    userId: serial("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    url: text("url").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("user_id_idx").on(table.userId), // Speed up lookups to User ID
]);

// =============================================================================
// 3. CONNECTIONS TABLE (The Platform Agnostic Layer)
// =============================================================================

export const connections = pgTable("connections", {
    id: serial("id").primaryKey(),
    websiteId: serial("website_id").references(() => websites.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // "meta", "tiktok", etc.
    platformIdentifiers: jsonb("platform_identifiers").notNull(), // Equivalent to mapped_column(JSON)
    encryptedAccessToken: text("encrypted_access_token"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("website_id_idx").on(table.websiteId),
]);

// =============================================================================
// 4. EVENT LOGS TABLE (The Core Engine)
// =============================================================================

export const eventLogs = pgTable("event_logs", {
    id: serial("id").primaryKey(),
    websiteId: serial("website_id").references(() => websites.id, { onDelete: "cascade" }),

    // Core Meta event details
    eventId: text("event_id"), // For deduplication
    eventName: text("event_name").notNull(),

    // We capture when *we* received it vs when it happened
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    eventTime: timestamp("event_time").notNull(), // Client-side timestamp

    eventSourceUrl: text("event_source_url"),

    // User Identifiers (Hashed or Raw - handled in logic layer)
    userIpAddress: text("user_ip_address"),
    userAgent: text("user_agent"),
    fbp: text("fbp"),
    fbc: text("fbc"),
    email: text("email"),
    phone: text("phone"),

    // Purhcase Data
    value: text("value"),
    currency: text("currency"),
}, (table) => [
    index("log_website_id_idx").on(table.websiteId),
    index("log_event_id_idx").on(table.eventId), // Critical for deduplication
    index("log_event_name_idx").on(table.eventName),
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