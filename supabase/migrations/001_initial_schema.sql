-- Bright Pearl Initial Schema Migration
-- This creates the core tables for the Bright Pearl platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE report_status AS ENUM ('pending', 'approved', 'rejected', 'published');
CREATE TYPE platform_status AS ENUM ('active', 'removed', 'unknown');
CREATE TYPE report_category AS ENUM ('hate_speech', 'harassment', 'violence', 'discrimination', 'misinformation', 'other');
CREATE TYPE moderator_action_type AS ENUM ('approve', 'reject', 'escalate', 'update_status');

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_email TEXT,
    submitter_ip_hash TEXT,
    platform TEXT NOT NULL,
    original_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category report_category NOT NULL,
    language TEXT NOT NULL, -- ISO 639-1 code
    country TEXT NOT NULL, -- ISO 3166-1 alpha-2 code
    platform_status platform_status DEFAULT 'unknown',
    status report_status DEFAULT 'pending',
    moderation_notes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    type TEXT NOT NULL CHECK (type IN ('screenshot', 'thumbnail')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderator actions log
CREATE TABLE moderator_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id),
    action moderator_action_type NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats snapshots for analytics
CREATE TABLE stats_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    json_metrics JSONB NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_platform ON reports(platform);
CREATE INDEX idx_reports_country ON reports(country);
CREATE INDEX idx_reports_language ON reports(language);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_platform_status ON reports(platform_status);
CREATE INDEX idx_attachments_report_id ON attachments(report_id);
CREATE INDEX idx_moderator_actions_report_id ON moderator_actions(report_id);
CREATE INDEX idx_moderator_actions_moderator_id ON moderator_actions(moderator_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to reports table
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE reports IS 'Main table storing all islamophobic content reports';
COMMENT ON TABLE attachments IS 'Screenshots and evidence files for reports';
COMMENT ON TABLE moderator_actions IS 'Audit log of all moderator actions';
COMMENT ON TABLE stats_snapshots IS 'Periodic snapshots of platform statistics';
