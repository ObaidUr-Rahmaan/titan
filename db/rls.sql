-- Enable RLS on tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription_changes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;

-- Note: DROP POLICY statements removed since reset script already handles policy cleanup

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_user_user_id ON "user"(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON "payments"(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON "subscriptions"(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON "invoices"(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON "refunds"(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON "subscription_changes"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON "user_activity"(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id ON "organization_memberships"(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_organization_id ON "organization_memberships"(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_invited_by ON "organization_invitations"(invited_by);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization_id ON "organization_invitations"(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON "organization_invitations"(email);

-- User table policies
CREATE POLICY "Users can view their own data" 
  ON "user" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own data" 
  ON "user" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own data" 
  ON "user" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own data" 
  ON "user" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Payments table policies
CREATE POLICY "Users can view their own payments" 
  ON "payments" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own payments" 
  ON "payments" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own payments" 
  ON "payments" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own payments" 
  ON "payments" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions" 
  ON "subscriptions" 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text));

CREATE POLICY "Users can insert their own subscriptions" 
  ON "subscriptions" 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text));

CREATE POLICY "Users can update their own subscriptions" 
  ON "subscriptions" 
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text))
  WITH CHECK (user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text));

CREATE POLICY "Users can delete their own subscriptions" 
  ON "subscriptions" 
  FOR DELETE 
  USING (user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text));

-- Subscription plans table policies (public readable, admin writable)
CREATE POLICY "Anyone can view subscription plans" 
  ON "subscriptions_plans" 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify subscription plans" 
  ON "subscriptions_plans" 
  FOR ALL 
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

-- Invoices table policies
CREATE POLICY "Users can view their own invoices" 
  ON "invoices" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own invoices" 
  ON "invoices" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own invoices" 
  ON "invoices" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own invoices" 
  ON "invoices" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Refunds table policies
CREATE POLICY "Users can view their own refunds" 
  ON "refunds" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own refunds" 
  ON "refunds" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own refunds" 
  ON "refunds" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own refunds" 
  ON "refunds" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Subscription changes table policies
CREATE POLICY "Users can view their own subscription changes" 
  ON "subscription_changes" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own subscription changes" 
  ON "subscription_changes" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own subscription changes" 
  ON "subscription_changes" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own subscription changes" 
  ON "subscription_changes" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- User activity table policies
CREATE POLICY "Users can view their own activity" 
  ON "user_activity" 
  FOR SELECT 
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own activity" 
  ON "user_activity" 
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own activity" 
  ON "user_activity" 
  FOR UPDATE 
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own activity" 
  ON "user_activity" 
  FOR DELETE 
  USING ((select auth.uid())::text = user_id);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" 
  ON "organizations" 
  FOR SELECT 
  USING (id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND is_active = true
  ));

CREATE POLICY "Organization owners can modify their organizations" 
  ON "organizations" 
  FOR ALL 
  USING (id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  ))
  WITH CHECK (id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  ));

-- Organization memberships table policies
CREATE POLICY "Users can view memberships for their organizations" 
  ON "organization_memberships" 
  FOR SELECT 
  USING (
    user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    OR organization_id IN (
      SELECT organization_id 
      FROM "organization_memberships" 
      WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
      AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage memberships" 
  ON "organization_memberships" 
  FOR ALL 
  USING (organization_id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  ));

-- Organization invitations table policies
CREATE POLICY "Users can view invitations they sent or received" 
  ON "organization_invitations" 
  FOR SELECT 
  USING (
    invited_by IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    OR email = (SELECT email FROM "user" WHERE user_id = (select auth.uid())::text)
    OR organization_id IN (
      SELECT organization_id 
      FROM "organization_memberships" 
      WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

CREATE POLICY "Organization admins can manage invitations" 
  ON "organization_invitations" 
  FOR ALL 
  USING (organization_id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id 
    FROM "organization_memberships" 
    WHERE user_id IN (SELECT id FROM "user" WHERE user_id = (select auth.uid())::text)
    AND role IN ('owner', 'admin')
    AND is_active = true
  )); 