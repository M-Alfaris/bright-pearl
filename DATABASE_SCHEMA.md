# Database Schema Reference

**Last Updated:** 2025-01-11
**Branch:** claude/run-full-test-011CUsTKMeQDopPZP7hEx69t

---

## 📊 Overview

### Database Statistics
- **Total Tables:** 22
- **Public Tables:** 1 (reports)
- **Auth Tables:** 12
- **Storage Tables:** 5
- **Other:** 4 (realtime, vault)

---

## 🔐 Main Application Tables

### **public.reports**

**Status:** ✅ Active, RLS Enabled
**Rows:** 10 (Demo data: 6 approved, 2 pending, 1 rejected, Total report_count: 818)

#### Columns

| Column | Type | Options | Default | Comment |
|--------|------|---------|---------|---------|
| `id` | bigint | Primary Key | nextval('reports_id_seq') | Auto-increment |
| `content_link` | text | Required | - | Original reported URL |
| `content_link_normalized` | text | Unique | - | Normalized URL for deduplication |
| `platform` | text | Required | - | twitter, facebook, instagram, youtube, tiktok, reddit, other |
| `country` | text | Required | - | ISO country code |
| `language` | text | Required | - | ISO language code |
| `content_type` | text | Required | - | Max 50 chars (post, video, comment, etc.) |
| `activity_status` | activity_status_enum | Nullable | 'active' | active or deleted |
| `status` | report_status_enum | Nullable | 'pending' | pending, approved, rejected |
| `report_count` | integer | Nullable | 1 | Number of times reported (> 0) |
| `submitter_ip_hash` | text | Nullable | - | SHA-256 hashed IP (not PII) |
| `created_at` | timestamptz | Nullable | now() | First report timestamp |
| `updated_at` | timestamptz | Nullable | now() | Last update timestamp |
| `description` | text | Nullable | - | Moderator context only (not public) |

#### Enums

```sql
-- activity_status_enum
'active'   -- Content still online
'deleted'  -- Content removed by platform

-- report_status_enum
'pending'  -- Awaiting moderation
'approved' -- Published to public dashboard
'rejected' -- Not published
```

#### RLS Policies

| Policy Name | Command | Roles | Condition |
|-------------|---------|-------|-----------|
| **Public can view approved reports** | SELECT | public | `status = 'approved'` |
| **Anyone can submit reports** | INSERT | public | Always allowed |
| **Moderators can view all** | SELECT | public | User has `role='moderator'` in metadata |
| **Moderators can update** | UPDATE | public | User has `role='moderator'` in metadata |
| **Moderators can delete** | DELETE | public | User has `role='moderator'` in metadata |

#### Constraints

```sql
CHECK (platform IN ('twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other'))
CHECK (LENGTH(content_type) <= 50)
CHECK (report_count > 0)
UNIQUE (content_link_normalized)
```

---

## 👥 Auth Schema

### **auth.users**

**Status:** ✅ Active, RLS Enabled
**Rows:** 1 (One moderator account)

#### Key Columns
- `id` (uuid) - Primary key
- `email` (varchar) - User email
- `encrypted_password` (varchar) - Hashed password
- `raw_user_meta_data` (jsonb) - **Contains `role: 'moderator'`**
- `created_at` (timestamptz)
- `last_sign_in_at` (timestamptz)

#### Moderator Role Check
```sql
-- RLS policies check moderator role like this:
EXISTS (
  SELECT 1 FROM auth.users
  WHERE users.id = auth.uid()
  AND (users.raw_user_meta_data->>'role') = 'moderator'
)
```

### **auth.sessions**

**Status:** ✅ Active, RLS Enabled
**Rows:** 1 (One active session)

---

## 📦 Storage Schema

### **storage.buckets**

**Status:** ✅ Active, RLS Enabled
**Rows:** 1 (One bucket configured)

#### Columns
- `id` (text) - Primary key
- `name` (text) - Bucket name
- `public` (boolean) - Public access flag
- `file_size_limit` (bigint) - Max file size
- `allowed_mime_types` (text[]) - Allowed types

---

## 🔌 Edge Functions

### Available Functions

| Function | Purpose | Access |
|----------|---------|--------|
| **get-public-reports** | Fetch approved reports for dashboard | ✅ Public (anon key) |
| **submit-report-v2** | Submit new report | ✅ Public (anon key) |
| **approve-report** | Approve/reject reports | 🔐 Moderator only |
| **update-status** | Update report status | 🔐 Moderator only |

---

## 🔐 Security Model

### Access Levels

#### 1. **Anonymous Users (Public)**
```typescript
Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}
```
- ✅ Can view: `status='approved'` reports only
- ✅ Can submit: New reports (created as `status='pending'`)
- ❌ Cannot: View pending/rejected reports
- ❌ Cannot: Approve, update, or delete reports

#### 2. **Authenticated Moderators**
```typescript
Authorization: Bearer ${userAuthToken}
// Where raw_user_meta_data->>'role' = 'moderator'
```
- ✅ Can view: ALL reports (pending, approved, rejected)
- ✅ Can update: Report status, activity_status, all fields
- ✅ Can delete: Any report
- ✅ Can approve/reject: Pending reports

---

## 📊 Current Data State

### Reports Breakdown
- **Total Reports:** 10
- **Approved:** 6 (visible to public)
- **Pending:** 2 (moderator review needed)
- **Rejected:** 1 (not published)
- **Total Report Count:** 818 (sum of all report_count values)

### Activity Status
Based on the 6 approved reports visible publicly:
- **Active Content:** Content still online
- **Deleted Content:** Content removed by platform

---

## 🔄 Data Flow

### Public Dashboard
```
Anonymous User
    ↓
Frontend (VITE_SUPABASE_ANON_KEY)
    ↓
Edge Function: get-public-reports
    ↓
Supabase RLS: WHERE status='approved'
    ↓
Returns: Approved reports only
```

### Report Submission
```
Anonymous User
    ↓
Frontend (VITE_SUPABASE_ANON_KEY)
    ↓
Edge Function: submit-report-v2
    ↓
Supabase: INSERT with status='pending'
    ↓
Success: Report queued for moderation
```

### Moderation
```
Moderator (Authenticated)
    ↓
Frontend (User Auth Token)
    ↓
Edge Function: approve-report
    ↓
Supabase RLS: Check role='moderator'
    ↓
UPDATE: status='approved' or 'rejected'
```

---

## 🔧 Recent Changes

### 2025-01-11 - Authentication Fix
**Commit:** `41c2f22`

**Issue:** Public dashboard was using user auth tokens causing 401 errors

**Fix:** Changed to use anon key for public access
```typescript
// BEFORE (Wrong)
const authToken = localStorage.getItem('sb-access-token') || '';
'Authorization': `Bearer ${authToken}`

// AFTER (Correct)
'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
```

---

## 📝 Notes

### Moderator Setup
To create a moderator account:
1. Create user via Supabase Dashboard → Authentication → Users
2. Set `raw_user_meta_data`:
   ```json
   {
     "role": "moderator"
   }
   ```
3. User can now access moderator endpoints

### Security Best Practices
- ✅ RLS enabled on all tables
- ✅ Anon key has read-only access to approved data
- ✅ Service role key never exposed to frontend
- ✅ IP addresses hashed (SHA-256) for privacy
- ✅ No PII stored in public-facing data
- ✅ GDPR compliant data handling

### Frontend Environment Variables Required
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

---

## 🚨 Critical Reminders

1. **Never expose service role key** - Only use anon key in frontend
2. **Always use anon key for public access** - Don't use user tokens for public data
3. **RLS policies are enforced** - Even with valid keys, policies restrict access
4. **Moderator role is in metadata** - Check `raw_user_meta_data->>'role'`
5. **Approved status = public** - Only approved reports visible to anonymous users

---

## 📈 Scalability Notes

### Current Architecture Supports
- Anonymous report submissions (no auth required)
- Public dashboard with filtering and pagination
- Secure moderator access control
- Report deduplication via normalized URLs
- Activity status tracking (active/deleted)

### Future Considerations
- Add indexes on frequently queried columns (platform, country, status)
- Consider partitioning for > 1M reports
- Add full-text search on description field
- Implement report analytics and trends
