-- Simplified RLS Policies for GDPR Compliance
-- Only public-approved data is accessible, moderators have full access

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can view approved reports (public transparency)
CREATE POLICY "Public can view approved reports"
    ON reports FOR SELECT
    USING (status = 'approved');

-- Policy: Anyone can insert new reports (anonymous submission)
-- Note: Actual submission goes through Edge Function for validation
CREATE POLICY "Anyone can submit reports"
    ON reports FOR INSERT
    WITH CHECK (true);

-- Policy: Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
    ON reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
    );

-- Policy: Moderators can update reports
CREATE POLICY "Moderators can update reports"
    ON reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
    );

-- Policy: Only moderators can delete reports (rare, for compliance/legal)
CREATE POLICY "Moderators can delete reports"
    ON reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
    );

-- ============================================================================
-- MODERATOR ACTIONS TABLE POLICIES
-- ============================================================================

-- Policy: Only moderators can insert actions
CREATE POLICY "Moderators can log actions"
    ON moderator_actions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
        AND moderator_id = auth.uid()
    );

-- Policy: Moderators can view all actions
CREATE POLICY "Moderators can view all actions"
    ON moderator_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
    );

-- ============================================================================
-- VIEWS FOR PUBLIC ACCESS
-- ============================================================================

-- Create a view for public dashboard (only approved reports)
CREATE OR REPLACE VIEW public_reports AS
SELECT
    id,
    'Content #' || id || ' – ' || content_type || ' on ' || platform AS title,
    content_link,
    platform,
    country,
    language,
    content_type,
    activity_status,
    report_count,
    created_at
FROM reports
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON public_reports TO anon;
GRANT SELECT ON public_reports TO authenticated;

COMMENT ON VIEW public_reports IS 'Public view of approved reports - GDPR compliant display format';
