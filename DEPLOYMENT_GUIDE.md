# Security-Hardened Deployment Guide

This guide covers deploying the security-hardened version of Bright Pearl.

## ⚠️ Important Security Changes

### 1. Environment Variables Required

**CRITICAL**: The application will NOT start without proper environment variables.

Create a `.env` file in the project root (see `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**For Production (Netlify)**:
- Set these in: Netlify Dashboard → Site Settings → Environment Variables
- Never commit `.env` file to Git

### 2. CORS Configuration

Update `/supabase/functions/_shared/security.ts` with your production domain:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://your-domain.netlify.app',  // ADD YOUR DOMAIN
  'https://your-custom-domain.com',   // ADD CUSTOM DOMAIN IF ANY
];
```

### 3. Moderator Setup

**Public registration is now DISABLED** for security.

**To add a new moderator:**

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite User" or "Add User"
3. Enter their email and temp password
4. After user is created, edit the user
5. Add to `raw_user_meta_data`:
   ```json
   {
     "role": "moderator"
   }
   ```
6. Save and inform the user of their credentials

**Verification:**
```sql
-- Run in Supabase SQL Editor to verify moderators
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'moderator';
```

### 4. Deploy Edge Functions

All Edge Functions have been updated with security improvements.

```bash
# Deploy all functions
supabase functions deploy submit-report-v2
supabase functions deploy approve-report
supabase functions deploy update-status
supabase functions deploy get-public-reports

# Verify deployment
supabase functions list
```

**Required Deno Permissions:**
The updated functions use Deno KV for rate limiting, which is automatically available in Supabase Edge Functions.

### 5. Rate Limiting

Default limits (can be adjusted in code):

| Endpoint | Limit | Window |
|----------|-------|--------|
| Submit Report | 5 requests | 1 hour per IP |
| Public Reports | 1000 requests | 1 hour per IP |
| Approve/Reject | 100 actions | 1 hour per moderator |
| Update Status | 100 actions | 1 hour per moderator |

### 6. Security Headers

Updated `netlify.toml` includes:
- ✅ HSTS (Strict-Transport-Security)
- ✅ CSP (Content-Security-Policy)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection

**No additional configuration needed** - headers are deployed automatically.

### 7. Audit Logging

All moderator actions are now logged to the `moderator_actions` table.

**View audit logs:**
```sql
SELECT
  ma.id,
  ma.action,
  ma.created_at,
  u.email as moderator_email,
  r.content_link
FROM moderator_actions ma
JOIN auth.users u ON ma.moderator_id = u.id
JOIN reports r ON ma.report_id = r.id
ORDER BY ma.created_at DESC
LIMIT 100;
```

## Deployment Steps

### Step 1: Update Environment Variables

**Local Development:**
```bash
cp .env.example .env
# Edit .env with your actual Supabase credentials
```

**Netlify Production:**
```bash
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

### Step 2: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy shared security module (if needed manually)
# Shared modules are automatically included

# Deploy all functions
supabase functions deploy submit-report-v2
supabase functions deploy approve-report
supabase functions deploy update-status
supabase functions deploy get-public-reports
```

### Step 3: Update CORS Origins

Edit `/supabase/functions/_shared/security.ts`:
```typescript
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com',
  // Add staging domains if needed
];
```

Re-deploy after changing CORS:
```bash
supabase functions deploy --no-verify-jwt submit-report-v2
supabase functions deploy --no-verify-jwt approve-report
supabase functions deploy --no-verify-jwt update-status
supabase functions deploy --no-verify-jwt get-public-reports
```

### Step 4: Deploy Frontend

```bash
# Build the frontend
npm run build

# Deploy to Netlify (if using Netlify CLI)
netlify deploy --prod

# Or push to GitHub (auto-deploys via Netlify)
git add .
git commit -m "Deploy security-hardened version"
git push origin main
```

### Step 5: Verify Deployment

**Test Checklist:**

- [ ] Environment variables loaded (check Network tab for errors)
- [ ] HTTPS redirects working
- [ ] Security headers present (check browser DevTools → Network → Response Headers)
- [ ] Rate limiting works (try submitting 6 reports quickly)
- [ ] Moderator login works
- [ ] Non-moderators cannot access moderator endpoints
- [ ] Audit logging works (check `moderator_actions` table)
- [ ] Public registration is disabled
- [ ] CORS only allows configured domains

**Manual Tests:**

```bash
# Test rate limiting
for i in {1..6}; do
  curl -X POST https://your-project.supabase.co/functions/v1/submit-report-v2 \
    -H "Content-Type: application/json" \
    -d '{"content_link":"https://example.com","platform":"twitter","country":"US","language":"en","content_type":"post"}' \
    -w "\nStatus: %{http_code}\n"
done
# 6th request should return 429 (Rate Limit Exceeded)

# Test moderator role validation
curl -X POST https://your-project.supabase.co/functions/v1/approve-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"report_id":1,"action":"approved"}'
# Should return 403 if user is not a moderator
```

## Monitoring

### Set Up Monitoring

1. **Supabase Dashboard** → Project Settings → API
   - Monitor rate limits
   - Check Edge Function logs

2. **Netlify Dashboard** → Analytics
   - Monitor traffic
   - Check error rates

3. **Create Alerts** (recommended):
   - Set up Supabase alerts for:
     - Failed authentication attempts (> 10/hour)
     - Edge Function errors (> 5% error rate)
     - Database connection issues

### Check Logs

**Edge Function Logs:**
```bash
supabase functions logs submit-report-v2
supabase functions logs approve-report
```

**Database Audit Logs:**
```sql
-- Recent moderator actions
SELECT * FROM moderator_actions ORDER BY created_at DESC LIMIT 50;

-- Suspicious activity (multiple rejections)
SELECT moderator_id, COUNT(*) as reject_count
FROM moderator_actions
WHERE action = 'reject' AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY moderator_id
HAVING COUNT(*) > 20;
```

## Security Checklist

Before going to production, verify:

- [ ] `.env` file is in `.gitignore` (already configured)
- [ ] No hardcoded credentials in source code
- [ ] CORS configured for production domains only
- [ ] All moderators have proper role metadata
- [ ] Public registration is disabled
- [ ] HTTPS enforced (HSTS headers)
- [ ] Security headers configured in `netlify.toml`
- [ ] Rate limiting tested and working
- [ ] Audit logging enabled and tested
- [ ] Input validation working on all endpoints
- [ ] Error messages don't leak sensitive information

## Rollback Plan

If issues occur after deployment:

1. **Revert Edge Functions:**
   ```bash
   # Deploy previous version
   git checkout previous-commit
   supabase functions deploy submit-report-v2
   ```

2. **Disable Rate Limiting** (emergency only):
   Edit `/supabase/functions/_shared/security.ts`:
   ```typescript
   // Temporarily increase limits
   const rateLimitResult = await checkRateLimit(key, 999999, windowMs);
   ```

3. **Enable Emergency Registration** (if needed):
   Edit `/src/authProvider.ts`:
   ```typescript
   register: async ({ email, password }) => {
     // Temporarily enable
     const { data, error } = await supabaseClient.auth.signUp({
       email,
       password,
     });
     // ...
   }
   ```

## Support

For issues:
1. Check SECURITY_AUDIT_REPORT.md for known issues
2. Review Edge Function logs in Supabase
3. Check Netlify deployment logs
4. Verify environment variables are set correctly

## Updates and Maintenance

**Monthly Security Tasks:**
- Review audit logs for suspicious activity
- Update Deno dependencies: `import { serve } from "https://deno.land/std@latest/http/server.ts"`
- Check for Supabase security advisories
- Review and rotate credentials if needed
- Test rate limiting effectiveness

**Quarterly Security Tasks:**
- Full penetration testing
- Review and update CORS origins
- Audit moderator accounts (remove inactive)
- Review and update CSP headers
- Dependency audit: `npm audit`
