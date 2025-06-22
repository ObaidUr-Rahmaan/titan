-- Migration: Upgrade user schema with subscription management fields
-- Run this after upgrading the schema definition

-- Add profile fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company" VARCHAR(100);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "job_title" VARCHAR(100);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Add onboarding tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN DEFAULT false;

-- Add trial and subscription management fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_trial" BOOLEAN DEFAULT true;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "trial_expires_at" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_status" VARCHAR DEFAULT 'trial';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_tier" VARCHAR;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP;

-- Add subscription change tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pending_subscription_change" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_plan_change_date" TIMESTAMP;

-- Add email tracking
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "welcome_email_sent" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "paid_welcome_email_sent" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "cancellation_email_sent" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "expired_email_sent" BOOLEAN DEFAULT false;

-- Update existing users to have proper defaults
UPDATE "user" SET 
  "is_trial" = true,
  "subscription_status" = 'trial',
  "onboarding_completed" = false,
  "welcome_email_sent" = false,
  "paid_welcome_email_sent" = false,
  "cancellation_email_sent" = false,
  "expired_email_sent" = false
WHERE "is_trial" IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN "user"."subscription_status" IS 'Current subscription status: trial, active, past_due, canceled, etc.';
COMMENT ON COLUMN "user"."subscription_tier" IS 'Subscription tier: basic, pro, business';
COMMENT ON COLUMN "user"."subscription_expires_at" IS 'When cancelled subscription actually expires';
COMMENT ON COLUMN "user"."pending_subscription_change" IS 'JSON object with pending change details';
COMMENT ON COLUMN "user"."last_plan_change_date" IS 'Track when user last changed plans'; 