-- Add description field for moderator context
-- This field is NOT displayed publicly, only to moderators

ALTER TABLE reports
ADD COLUMN description TEXT;

COMMENT ON COLUMN reports.description IS 'Optional description provided by submitter for moderator context only. Not displayed publicly.';
