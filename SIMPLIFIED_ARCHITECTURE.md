# Bright Pearl - Simplified Architecture (GDPR-Compliant)

## Overview

This document outlines the **simplified, GDPR-compliant architecture** implemented for Bright Pearl. This redesign focuses on minimal data storage, URL deduplication, factual public display, and compliance with European data protection laws.

## Architecture Principles

### 1. **Minimal Data Storage**
- Only essential fields are stored
- No personal data (names, emails, IP addresses in plain text)
- No screenshots or media files
- IP addresses are SHA-256 hashed for rate limiting only

### 2. **GDPR Compliance**
- **Right to be forgotten**: Content can be removed via takedown procedure
- **Data minimization**: Only necessary data collected
- **Purpose limitation**: Data used only for tracking islamophobic content
- **Legal basis**: Legitimate interest (public transparency)
- **EU region deployment**: Data stored in EU Supabase region

### 3. **Deduplication**
- URLs are normalized (tracking parameters removed)
- Duplicate submissions increment `report_count` instead of creating new records
- Public display shows aggregate count of reports

### 4. **Factual Display Only**
- Public format: **"Content #123 – post on facebook"**
- No commentary, usernames, or editorial content
- Only verifiable facts: ID, content type, platform

---

## Database Schema

### Single Table: `reports`

```sql
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    content_link TEXT NOT NULL,                  -- Original URL
    content_link_normalized TEXT NOT NULL UNIQUE, -- Normalized for deduplication
    platform TEXT NOT NULL,                       -- twitter, facebook, etc.
    country TEXT NOT NULL,                        -- Country code (US, GB, etc.)
    language TEXT NOT NULL,                       -- Language code (en, ar, etc.)
    content_type TEXT NOT NULL,                   -- tweet, post, video, comment, etc.
    activity_status activity_status_enum DEFAULT 'active',  -- active or deleted
    status report_status_enum DEFAULT 'pending',  -- pending, approved, rejected
    report_count INTEGER DEFAULT 1,               -- Number of times reported
    submitter_ip_hash TEXT,                       -- SHA-256 hashed IP (rate limiting)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Public View: `public_reports`

```sql
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
```

---

## Edge Functions

### 1. **submit-report-v2** - Public Submission with Deduplication

**Endpoint**: `/functions/v1/submit-report-v2`

**Request**:
```json
{
  "content_link": "https://twitter.com/example/status/123456",
  "platform": "twitter",
  "country": "US",
  "language": "en",
  "content_type": "tweet"
}
```

**Logic**:
1. Validate input (required fields, valid platform)
2. Rate limiting: 5 submissions per hour per IP (hashed)
3. Normalize URL (remove tracking params: utm_*, fbclid, gclid, etc.)
4. Check if `content_link_normalized` exists
   - **If exists**: Increment `report_count`
   - **If new**: Insert new record with `report_count = 1`
5. Return `report_id` and `report_count`

**Response**:
```json
{
  "success": true,
  "report_id": 123,
  "report_count": 5,
  "message": "Thank you. This content has been reported before. Your report has been added to the count."
}
```

### 2. **approve-report** - Moderator Action

**Endpoint**: `/functions/v1/approve-report`

**Authentication**: Required (moderator only)

**Request**:
```json
{
  "report_id": 123,
  "action": "approved" // or "rejected"
}
```

**Logic**:
1. Verify authenticated user
2. Check report exists and status is `pending`
3. Update `status` to `approved` or `rejected`
4. Return updated report

### 3. **get-public-reports** - Public Dashboard Data (Cached)

**Endpoint**: `/functions/v1/get-public-reports?page=1&pageSize=50&platform=twitter&activity_status=active`

**Cache**: 60 seconds (`Cache-Control: public, max-age=60`)

**Logic**:
1. Query `public_reports` view (approved only)
2. Apply filters (platform, country, language, activity_status)
3. Pagination support
4. Return formatted data

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "Content #123 – tweet on twitter",
      "content_link": "https://twitter.com/example/status/123456",
      "platform": "twitter",
      "country": "US",
      "language": "en",
      "content_type": "tweet",
      "activity_status": "active",
      "report_count": 5,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1523,
    "totalPages": 31
  }
}
```

### 4. **update-status** - Activity Status Updater

**Endpoint**: `/functions/v1/update-status`

**Authentication**: Required (moderator only)

**Request**:
```json
{
  "report_id": 123,
  "activity_status": "deleted" // or "active"
}
```

**Logic**:
1. Verify authenticated user
2. Update `activity_status` field
3. Used to mark content as deleted when removed from platform

---

## Frontend Architecture

### Public Pages (No Authentication Required)

1. **Public Dashboard** ([src/pages/public-dashboard/index.tsx](src/pages/public-dashboard/index.tsx))
   - Card-based grid display
   - Filters: platform, language, activity_status
   - Fetches from `get-public-reports` Edge Function
   - Display format: "Content #123 – post on facebook"
   - Shows report count if > 1

2. **Submit Report** ([src/pages/reports/create.tsx](src/pages/reports/create.tsx))
   - Simple form: platform, content_type, content_link, language, country
   - Dynamic content_type based on platform
   - Submits to `submit-report-v2` Edge Function
   - Shows deduplication feedback (report_count)

3. **About** ([src/pages/about/index.tsx](src/pages/about/index.tsx))
   - Project mission and goals

4. **Policies** ([src/pages/policies/index.tsx](src/pages/policies/index.tsx))
   - GDPR compliance notice
   - Takedown procedure
   - Terms of Service

### Authenticated Pages (Moderator Only)

1. **Moderator Queue** ([src/pages/moderator/pending.tsx](src/pages/moderator/pending.tsx))
   - List pending reports
   - Approve/reject actions via `approve-report` Edge Function
   - Shows full details including content_link and report_count

2. **All Reports** ([src/pages/reports/list.tsx](src/pages/reports/list.tsx))
   - Filter by status, platform
   - Manage approved/rejected reports

3. **Report Details** ([src/pages/reports/show.tsx](src/pages/reports/show.tsx))
   - View full report details

4. **Edit Report** ([src/pages/reports/edit.tsx](src/pages/reports/edit.tsx))
   - Update activity_status (active/deleted)

---

## Security & Compliance

### Rate Limiting
- **5 submissions per hour per IP** (hashed with SHA-256)
- Enforced at Edge Function level using Deno KV
- Retry-After header returned on 429 status

### Row-Level Security (RLS)

```sql
-- Public can view approved reports
CREATE POLICY "public_read_approved" ON reports
FOR SELECT USING (status = 'approved');

-- Authenticated users can view all
CREATE POLICY "auth_read_all" ON reports
FOR SELECT TO authenticated USING (true);

-- Authenticated users can update
CREATE POLICY "auth_update_all" ON reports
FOR UPDATE TO authenticated USING (true);
```

### Data Protection
- **No PII stored**: No names, emails, or personal identifiers
- **IP hashing**: SHA-256 one-way hash for rate limiting
- **URL normalization**: Removes tracking parameters
- **Minimal retention**: Content can be removed via takedown procedure

---

## Deployment

### Supabase Configuration

1. **Create Supabase Project** in EU region (Frankfurt or London)
2. **Run Migrations**:
   ```bash
   supabase db push
   ```

3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy submit-report-v2
   supabase functions deploy approve-report
   supabase functions deploy get-public-reports
   supabase functions deploy update-status
   ```

4. **Set Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Frontend Deployment (Netlify)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## Content Types by Platform

| Platform | Content Types |
|----------|---------------|
| Twitter  | tweet, reply, retweet, quote |
| Facebook | post, comment, share, reel |
| Instagram | post, story, reel, comment |
| YouTube  | video, comment, short |
| TikTok   | video, comment |
| Reddit   | post, comment |
| Other    | content |

---

## Compliance Documents

### Required Pages

1. **Privacy Policy** - GDPR-compliant data handling
2. **Terms of Service** - User agreement
3. **Takedown Procedure** - Content removal process
4. **Acceptance Criteria** - What qualifies as islamophobic content

---

## Migration from Old Architecture

### Breaking Changes

1. **Removed Tables**:
   - `attachments` - No screenshots stored
   - `moderator_actions` - Simplified to status field
   - `stats_snapshots` - No historical snapshots

2. **Removed Fields**:
   - `title` - Generated from ID + content_type + platform
   - `description` - Not publicly displayed
   - `category` - Simplified to content_type
   - `platform_status` - Renamed to `activity_status`
   - `submitter_email` - No PII stored
   - `moderation_notes` - Removed

3. **New Fields**:
   - `content_link_normalized` - For deduplication
   - `report_count` - Number of duplicate submissions
   - `submitter_ip_hash` - SHA-256 hashed IP

### Migration Script

```sql
-- Run migrations in order
\i supabase/migrations/003_simplified_schema.sql
\i supabase/migrations/004_simplified_rls.sql
```

---

## Testing

### Edge Function Testing

```bash
# Test submit-report-v2
curl -X POST https://your-project.supabase.co/functions/v1/submit-report-v2 \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content_link": "https://twitter.com/test/status/123",
    "platform": "twitter",
    "country": "US",
    "language": "en",
    "content_type": "tweet"
  }'

# Test get-public-reports
curl "https://your-project.supabase.co/functions/v1/get-public-reports?page=1&pageSize=10" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## Performance

### Caching Strategy
- **Public reports**: 60-second HTTP cache
- **Database queries**: Indexed on `content_link_normalized`, `status`, `created_at`

### Optimization
- Use `public_reports` view for public queries (pre-filtered, approved only)
- Pagination with `LIMIT`/`OFFSET` for large datasets
- Future: Implement Redis for longer caching (5 minutes)

---

## Monitoring

### Key Metrics
1. **Submission rate**: Reports per hour
2. **Duplicate rate**: % of submissions that increment existing reports
3. **Approval rate**: % of pending reports approved
4. **Rate limit hits**: 429 responses per hour

### Logging
- All Edge Functions log to Supabase Logs
- Monitor rate limiting effectiveness
- Track deduplication success rate

---

## Future Enhancements

1. **Automated verification**: Check if content still exists on platform
2. **Cron job**: Periodically update `activity_status` via platform APIs
3. **API for researchers**: Public API for approved data
4. **Export functionality**: CSV/JSON export for research
5. **Advanced analytics**: Trends by platform, country, time period

---

## Support

For issues or questions:
- **GitHub Issues**: [brightpearl/issues](https://github.com/brightpearl/issues)
- **Email**: contact@brightpearl.org
- **Documentation**: [QUICKSTART.md](QUICKSTART.md)

---

## License

MIT License - See [LICENSE](LICENSE) file for details.
