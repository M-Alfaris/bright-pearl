# Deployment Checklist - Bright Pearl (Simplified Architecture)

## ✅ Completed

- [x] Database migrations created
- [x] Edge Functions implemented (4 functions)
- [x] Frontend rebuilt with simplified architecture
- [x] TypeScript types updated
- [x] Build succeeds locally
- [x] Documentation written

## 📋 Deployment Steps

### 1. Supabase Setup (EU Region Required for GDPR)

#### Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project in **EU region** (Frankfurt or London)
3. Note down:
   - Project URL
   - Anon (public) key
   - Service role key

#### Run Database Migrations
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

This will run:
- `003_simplified_schema.sql` - Creates simplified reports table
- `004_simplified_rls.sql` - Sets up RLS policies and public_reports view

#### Deploy Edge Functions
```bash
cd "/Users/user/Desktop/Projects/Bright Pearl"

# Deploy all functions
supabase functions deploy submit-report-v2
supabase functions deploy approve-report
supabase functions deploy get-public-reports
supabase functions deploy update-status

# Verify deployments
supabase functions list
```

#### Create Moderator Account
1. Go to Authentication > Users in Supabase Dashboard
2. Create a new user with email/password
3. This will be your moderator login

### 2. Environment Variables

Create a `.env.production` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Frontend Deployment (Netlify)

#### Option A: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### Option B: Deploy via Netlify Dashboard
1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment variables**:
     - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`

### 4. Test Deployment

#### Test Public Features
1. Visit your deployed site
2. Go to `/submit`
3. Submit a test report:
   - Platform: Twitter
   - Content Type: tweet
   - URL: `https://twitter.com/test/status/123`
   - Country: US
   - Language: English
4. Verify success message shows `report_id` and `report_count`

#### Test Rate Limiting
1. Submit 6 reports quickly
2. Should get rate limit error on 6th attempt
3. Error message should show "retry in X minutes"

#### Test Deduplication
1. Submit the same URL twice (same normalized URL)
2. Second submission should show `report_count: 2`
3. Third submission should show `report_count: 3`

#### Test Moderator Functions
1. Go to `/login`
2. Login with moderator account
3. Go to `/moderator/pending`
4. Should see pending reports
5. Approve one report
6. Check public dashboard - approved report should appear

#### Test Public Dashboard
1. Go to `/dashboard`
2. Should see approved reports in card format
3. Format: "Content #123 – tweet on twitter"
4. Test filters: platform, language, status
5. Verify pagination works

### 5. Performance Verification

#### Check Caching
```bash
# Test public reports endpoint
curl -I https://your-project.supabase.co/functions/v1/get-public-reports?page=1

# Look for header:
# Cache-Control: public, max-age=60
```

#### Check Database Indexes
```sql
-- In Supabase SQL Editor, verify indexes exist:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'reports';
```

Should show indexes on:
- `content_link_normalized` (unique)
- `status`
- `created_at`

### 6. Security Verification

#### RLS Policies Active
```sql
-- In Supabase SQL Editor:
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'reports';
```

Should show:
- `public_read_approved` - Public can view approved
- `auth_read_all` - Authenticated can view all
- `auth_update_all` - Authenticated can update

#### Test Unauthorized Access
```bash
# Try to access moderator endpoint without auth
curl -X POST https://your-project.supabase.co/functions/v1/approve-report \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"report_id": 1, "action": "approved"}'

# Should return 401 Unauthorized
```

## 📊 Monitoring Setup

### Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Monitor Edge Function logs for:
   - Rate limit hits (429 responses)
   - Submission rate
   - Deduplication rate

### Netlify Analytics
1. Enable Netlify Analytics (optional, paid)
2. Monitor:
   - Page views
   - Unique visitors
   - Popular pages

## 🔒 GDPR Compliance Verification

- [x] No PII stored (verified in schema)
- [x] IP addresses hashed with SHA-256
- [x] Data stored in EU region
- [x] Minimal data collection
- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Takedown procedure documented

## 📝 Post-Deployment Tasks

### 1. Create Compliance Pages

Create these pages in `src/pages/`:
- `privacy-policy/index.tsx` - GDPR privacy policy
- `terms-of-service/index.tsx` - User terms
- `takedown-procedure/index.tsx` - Content removal process

### 2. Update Public Layout

Add links to compliance pages in footer:
```typescript
// src/components/public-layout/index.tsx
<Footer>
  <Link to="/privacy-policy">Privacy Policy</Link>
  <Link to="/terms-of-service">Terms of Service</Link>
  <Link to="/takedown-procedure">Takedown Procedure</Link>
</Footer>
```

### 3. Optional: Add reCAPTCHA

To prevent bot submissions:
1. Get reCAPTCHA v3 keys from Google
2. Add to submission form
3. Verify in Edge Function

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Edge Functions Not Working
```bash
# Check function logs
supabase functions logs submit-report-v2

# Redeploy specific function
supabase functions deploy submit-report-v2 --no-verify-jwt
```

### Database Connection Issues
- Verify project URL is correct
- Check anon key is set
- Ensure RLS policies are enabled

### Rate Limiting Not Working
- Check Deno KV is enabled in Supabase
- Verify Edge Function has KV access
- Check logs for KV errors

## 📞 Support

If you encounter issues:
1. Check [SIMPLIFIED_ARCHITECTURE.md](SIMPLIFIED_ARCHITECTURE.md) for detailed docs
2. Check [FIXES_APPLIED.md](FIXES_APPLIED.md) for known issues
3. Review Supabase logs for errors
4. Check browser console for frontend errors

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Public can submit reports without login
- ✅ Duplicate submissions increment report_count
- ✅ Rate limiting blocks after 5 submissions/hour
- ✅ Moderators can approve/reject reports
- ✅ Approved reports appear on public dashboard
- ✅ Public dashboard shows "Content #ID – type on platform" format
- ✅ Caching header present on public reports (60s)
- ✅ All data stored in EU region
- ✅ No PII stored anywhere

## 📈 Next Steps

After successful deployment:
1. Monitor usage and performance
2. Create compliance pages
3. Set up automated backups
4. Consider adding automated status checking (cron job)
5. Add CSV export for researchers
6. Implement advanced analytics

---

**Last Updated**: November 3, 2025
**Architecture Version**: Simplified v2.0 (GDPR-Compliant)
