CREATE TYPE "public"."change_status" AS ENUM('pending', 'scheduled', 'completed', 'failed', 'cancelled', 'aborted');--> statement-breakpoint
CREATE TYPE "public"."change_type" AS ENUM('upgrade', 'downgrade', 'cancellation', 'reactivation');--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"email" varchar NOT NULL,
	"first_name" text,
	"last_name" text,
	"gender" text,
	"profile_image_url" text,
	"user_id" varchar NOT NULL,
	"clerk_user_id" varchar,
	"subscription" text,
	"company" varchar(100),
	"job_title" varchar(100),
	"bio" text,
	"onboarding_completed" boolean DEFAULT false,
	"is_trial" boolean DEFAULT true,
	"trial_expires_at" timestamp,
	"subscription_status" varchar DEFAULT 'trial',
	"subscription_tier" varchar,
	"subscription_expires_at" timestamp,
	"pending_subscription_change" text,
	"last_plan_change_date" timestamp,
	"welcome_email_sent" boolean DEFAULT false,
	"paid_welcome_email_sent" boolean DEFAULT false,
	"cancellation_email_sent" boolean DEFAULT false,
	"expired_email_sent" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"stripe_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"amount" varchar NOT NULL,
	"payment_time" varchar NOT NULL,
	"payment_date" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_details" text NOT NULL,
	"payment_intent" varchar NOT NULL,
	"organization_id" integer
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"updated_time" timestamp DEFAULT now(),
	"subscription_id" varchar NOT NULL,
	"stripe_user_id" varchar,
	"stripe_customer_id" varchar,
	"clerk_user_id" varchar,
	"status" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"plan_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_amount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'usd',
	"default_payment_method_id" varchar,
	"email" varchar NOT NULL,
	"user_id" integer,
	"organization_id" integer,
	"seat_limit" integer,
	"used_seats" integer DEFAULT 1,
	"auto_add_seats" boolean DEFAULT false,
	"metadata" text,
	"proration_behavior" varchar DEFAULT 'create_prorations',
	"billing_cycle_anchor" timestamp,
	"tax_percent" numeric(5, 2),
	"discount_id" varchar,
	"subscription_type" varchar DEFAULT 'individual' NOT NULL,
	"deleted_at" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "subscriptions_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"updated_time" timestamp DEFAULT now(),
	"plan_id" varchar NOT NULL,
	"stripe_price_id" varchar,
	"stripe_product_id" varchar,
	"name" varchar(100) NOT NULL,
	"description" text,
	"short_description" varchar(200),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"interval" varchar NOT NULL,
	"interval_count" integer DEFAULT 1,
	"plan_type" varchar DEFAULT 'individual' NOT NULL,
	"tier" varchar,
	"is_per_seat" boolean DEFAULT false,
	"min_seats" integer DEFAULT 1,
	"max_seats" integer,
	"seat_price" numeric(10, 2),
	"trial_period_days" integer DEFAULT 0,
	"has_free_trial" boolean DEFAULT false,
	"features" text,
	"feature_limits" text,
	"member_limit" integer,
	"project_limit" integer,
	"storage_limit" integer,
	"api_rate_limit" integer,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"is_legacy" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"recommended" boolean DEFAULT false,
	"popular" boolean DEFAULT false,
	"metadata" text,
	"billing_scheme" varchar DEFAULT 'per_unit',
	"tiered_pricing" text,
	"deleted_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "subscriptions_plans_plan_id_unique" UNIQUE("plan_id"),
	CONSTRAINT "subscriptions_plans_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"stripe_subscription_id" varchar NOT NULL,
	"from_tier" varchar(50),
	"to_tier" varchar(50) NOT NULL,
	"change_type" "change_type" NOT NULL,
	"change_status" "change_status" DEFAULT 'pending' NOT NULL,
	"effective_date" timestamp NOT NULL,
	"proration_amount" numeric(10, 2),
	"reason" varchar(255),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"organization_id" integer
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"invoice_id" varchar NOT NULL,
	"subscription_id" varchar NOT NULL,
	"amount_paid" varchar NOT NULL,
	"amount_due" varchar,
	"currency" varchar NOT NULL,
	"status" varchar NOT NULL,
	"email" varchar NOT NULL,
	"user_id" varchar,
	"organization_id" integer
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"payment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"refund_id" varchar NOT NULL,
	"amount" varchar NOT NULL,
	"currency" varchar NOT NULL,
	"refund_date" timestamp NOT NULL,
	"status" varchar NOT NULL,
	"reason" text,
	"metadata" text,
	"organization_id" integer
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"source" text DEFAULT 'web' NOT NULL,
	"related_entity_type" text,
	"related_entity_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"updated_time" timestamp DEFAULT now(),
	"clerk_organization_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"stripe_customer_id" varchar,
	"subscription_status" varchar DEFAULT 'trial',
	"subscription_tier" varchar,
	"subscription_expires_at" timestamp,
	"is_trial" boolean DEFAULT true,
	"trial_expires_at" timestamp,
	"member_limit" integer DEFAULT 5,
	"current_member_count" integer DEFAULT 1,
	"features_enabled" text,
	"verified_domains" text,
	"domain_verification_enabled" boolean DEFAULT false,
	"allow_member_invites" boolean DEFAULT true,
	"require_two_factor" boolean DEFAULT false,
	"metadata" text,
	"deleted_at" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "organizations_clerk_organization_id_unique" UNIQUE("clerk_organization_id"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"updated_time" timestamp DEFAULT now(),
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"clerk_organization_id" varchar NOT NULL,
	"clerk_user_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"permissions" text,
	"status" varchar DEFAULT 'active',
	"joined_at" timestamp DEFAULT now(),
	"invited_at" timestamp,
	"invited_by" integer,
	"previous_role" varchar,
	"role_changed_at" timestamp,
	"role_changed_by" integer,
	"last_active_at" timestamp,
	"access_level" varchar DEFAULT 'full',
	"removed_at" timestamp,
	"removed_by" integer,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_time" timestamp DEFAULT now(),
	"updated_time" timestamp DEFAULT now(),
	"organization_id" integer NOT NULL,
	"clerk_organization_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"permissions" text,
	"invitation_token" varchar NOT NULL,
	"clerk_invitation_id" varchar,
	"invited_by" integer NOT NULL,
	"inviter_name" varchar,
	"inviter_email" varchar,
	"message" text,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"responded_at" timestamp,
	"accepted_by" integer,
	"declined_reason" text,
	"email_sent" boolean DEFAULT false,
	"reminders_sent" integer DEFAULT 0,
	"last_reminder_sent" timestamp,
	"revoked_at" timestamp,
	"revoked_by" integer,
	"revoked_reason" text,
	"max_uses" integer DEFAULT 1,
	"used_count" integer DEFAULT 0,
	"metadata" text,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "organization_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscriptions_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscriptions_plans"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_changes" ADD CONSTRAINT "subscription_changes_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_role_changed_by_user_id_fk" FOREIGN KEY ("role_changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_removed_by_user_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_activity_user_id_idx" ON "user_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_activity_activity_type_idx" ON "user_activity" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "user_activity_category_idx" ON "user_activity" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_activity_created_at_idx" ON "user_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_activity_source_idx" ON "user_activity" USING btree ("source");--> statement-breakpoint
CREATE INDEX "user_activity_related_entity_idx" ON "user_activity" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "user_activity_organization_id_idx" ON "user_activity" USING btree ("organization_id");