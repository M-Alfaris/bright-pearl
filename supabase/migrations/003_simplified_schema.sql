-- Bright Pearl Simplified Schema Migration
-- GDPR and Irish Law Compliant Architecture
-- This migration transforms the database to the new simplified model

-- Drop old tables and start fresh
DROP TABLE IF EXISTS moderator_actions CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS stats_snapshots CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- Drop old types
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS platform_status CASCADE;
DROP TYPE IF EXISTS report_category CASCADE;
DROP TYPE IF EXISTS moderator_action_type CASCADE;

-- Create new simplified ENUM types
CREATE TYPE report_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE activity_status_enum AS ENUM ('active', 'deleted');

-- Main reports table - simplified and compliance-focused
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,

    -- Core public fields
    content_link TEXT NOT NULL,
    content_link_normalized TEXT NOT NULL UNIQUE, -- For deduplication
    platform TEXT NOT NULL,
    country TEXT NOT NULL, -- ISO 3166-1 alpha-2
    language TEXT NOT NULL, -- ISO 639-1
    content_type TEXT NOT NULL, -- e.g., "post", "comment", "reel", "video"

    -- Status tracking
    activity_status activity_status_enum DEFAULT 'active',
    status report_status_enum DEFAULT 'pending',
    report_count INTEGER DEFAULT 1,

    -- Metadata (not displayed publicly)
    submitter_ip_hash TEXT, -- Hashed IP for abuse detection only

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT valid_platform CHECK (platform IN ('twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other')),
    CONSTRAINT valid_content_type CHECK (LENGTH(content_type) <= 50),
    CONSTRAINT positive_report_count CHECK (report_count > 0)
);

-- Indexes for fast queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_platform ON reports(platform);
CREATE INDEX idx_reports_country ON reports(country);
CREATE INDEX idx_reports_language ON reports(language);
CREATE INDEX idx_reports_activity_status ON reports(activity_status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_normalized_link ON reports(content_link_normalized);

-- Moderator actions audit log (minimal, for accountability only)
CREATE TABLE moderator_actions (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'update_status')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderator_actions_report_id ON moderator_actions(report_id);
CREATE INDEX idx_moderator_actions_moderator_id ON moderator_actions(moderator_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function to normalize URLs (remove tracking params)
CREATE OR REPLACE FUNCTION normalize_url(url TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized TEXT;
BEGIN
    -- Remove common tracking parameters
    normalized := regexp_replace(url, '[?&](utm_[^&]*|fbclid=[^&]*|gclid=[^&]*|ref=[^&]*)', '', 'g');

    -- Remove trailing ? or &
    normalized := regexp_replace(normalized, '[?&]$', '');

    -- Convert to lowercase for consistency
    normalized := LOWER(TRIM(normalized));

    RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments for documentation
COMMENT ON TABLE reports IS 'Simplified reports table - GDPR compliant, no PII stored';
COMMENT ON COLUMN reports.content_link_normalized IS 'Normalized URL for deduplication (tracking params removed)';
COMMENT ON COLUMN reports.report_count IS 'Number of times this content has been reported';
COMMENT ON COLUMN reports.submitter_ip_hash IS 'SHA-256 hashed IP for abuse detection only, not PII';
COMMENT ON COLUMN reports.activity_status IS 'Whether content is still active or has been deleted by platform';
COMMENT ON TABLE moderator_actions IS 'Audit log for moderator actions (minimal, for accountability)';
