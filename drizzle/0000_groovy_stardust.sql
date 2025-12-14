CREATE TYPE "public"."connection_type" AS ENUM('source', 'destination');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('pending', 'processing', 'failed', 'duplicate');--> statement-breakpoint
CREATE TABLE "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer,
	"platform" text NOT NULL,
	"type" "connection_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"encrypted_access_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"website_id" integer,
	"event_id" text NOT NULL,
	"event_name" text NOT NULL,
	"event_source_url" text,
	"user_ip_address" text,
	"user_agent" text,
	"fbp" text,
	"fbc" text,
	"hashed_email" text,
	"hashed_phone" text,
	"value" text,
	"currency" text,
	"status" "processing_status" DEFAULT 'pending' NOT NULL,
	"platform_response" jsonb,
	"original_payload" jsonb,
	"match_quality_score" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"event_time" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"is_onboarded" boolean DEFAULT false,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "website_id_idx" ON "connections" USING btree ("website_id");--> statement-breakpoint
CREATE INDEX "log_website_id_idx" ON "event_logs" USING btree ("website_id");--> statement-breakpoint
CREATE INDEX "log_event_id_idx" ON "event_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "log_event_name_idx" ON "event_logs" USING btree ("event_name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_event_id_per_site" ON "event_logs" USING btree ("website_id","event_id");--> statement-breakpoint
CREATE INDEX "clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "websites" USING btree ("user_id");