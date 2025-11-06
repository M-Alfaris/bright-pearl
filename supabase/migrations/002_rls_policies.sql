-- Row Level Security (RLS) Policies for Bright Pearl
-- This ensures proper access control between public users, moderators, and admins

-- Enable RLS on all tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can submit a report (INSERT)
CREATE POLICY "Anyone can submit reports"
    ON reports FOR INSERT
    WITH CHECK (true);

-- Policy: Public can view approved/published reports (SELECT)
CREATE POLICY "Public can view approved reports"
    ON reports FOR SELECT
    USING (status IN ('approved', 'published'));

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

-- Policy: Admins can delete reports
CREATE POLICY "Admins can delete reports"
    ON reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- ATTACHMENTS TABLE POLICIES
-- ============================================================================

-- Policy: Anyone can upload attachments with their report
CREATE POLICY "Anyone can upload attachments"
    ON attachments FOR INSERT
    WITH CHECK (true);

-- Policy: Public can view attachments for approved reports
CREATE POLICY "Public can view approved attachments"
    ON attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reports
            WHERE reports.id = attachments.report_id
            AND reports.status IN ('approved', 'published')
        )
    );

-- Policy: Moderators can view all attachments
CREATE POLICY "Moderators can view all attachments"
    ON attachments FOR SELECT
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
-- STATS SNAPSHOTS TABLE POLICIES
-- ============================================================================

-- Policy: Public can view stats snapshots
CREATE POLICY "Public can view stats"
    ON stats_snapshots FOR SELECT
    USING (true);

-- Policy: Only admins can insert stats
CREATE POLICY "Admins can insert stats"
    ON stats_snapshots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload to screenshots bucket
CREATE POLICY "Anyone can upload screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'screenshots');

-- Policy: Public can view screenshots for approved reports
CREATE POLICY "Public can view approved screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'screenshots' AND
        EXISTS (
            SELECT 1 FROM attachments a
            JOIN reports r ON r.id = a.report_id
            WHERE a.storage_path = name
            AND r.status IN ('approved', 'published')
        )
    );

-- Policy: Moderators can view all screenshots
CREATE POLICY "Moderators can view all screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'screenshots' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'moderator'
        )
    );
