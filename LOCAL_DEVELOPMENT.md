# 🔧 Local Development Setup - Bright Pearl

**IMPORTANT:** This guide is for developers who want to run the application locally on their computer.

---

## ⚠️ Critical Requirement: Environment Variables

### The 401 Unauthorized Error

If you see these errors in your browser console:

```
GET https://dmhscktlbmkmumhzkhjd.supabase.co/rest/v1/reports?... 401 (Unauthorized)
GET https://dmhscktlbmkmumhzkhjd.supabase.co/functions/v1/get-public-reports?... 401 (Unauthorized)
Error fetching reports: Error: Failed to fetch reports
```

**This means you have NOT set up your `.env` file with Supabase credentials.**

The application **CANNOT WORK** without proper environment variables configured.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Create a new project
3. Wait for it to initialize (~2 minutes)

### Step 3: Get Your Credentials

1. In Supabase Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xyz123.supabase.co`)
   - **Anon/Public Key** (long JWT token starting with `eyJ...`)

### Step 4: Create `.env` File

Create a file named `.env` in the project root directory (same level as `package.json`):

```bash
# Bright Pearl Environment Variables

VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**Replace** `YOUR_PROJECT_ID` and `YOUR_ANON_KEY_HERE` with your actual values from Step 3.

**Example (with fake values - don't copy these):**
```bash
VITE_SUPABASE_URL=https://dmhscktlbmkmumhzkhjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaHNja3RsYm1rbXVtaHpraGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg5MzMyMDAsImV4cCI6MjAxNDUwOTIwMH0.example123
```

### Step 5: Set Up Database

In Supabase Dashboard → **SQL Editor**, run this SQL:

```sql
-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    link TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_type TEXT,
    description TEXT,
    country TEXT,
    language TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    activity_status TEXT DEFAULT 'active' CHECK (activity_status IN ('active', 'deleted')),
    report_count INT DEFAULT 1,
    report_id INT GENERATED ALWAYS AS IDENTITY,
    ip_hash TEXT,
    user_agent TEXT,
    origin TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID,
    moderation_notes TEXT
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view approved reports
CREATE POLICY "Public can view approved reports"
ON public.reports FOR SELECT
TO anon
USING (status = 'approved');

-- RLS Policy: Anyone can submit reports
CREATE POLICY "Anyone can submit reports"
ON public.reports FOR INSERT
TO anon
WITH CHECK (true);

-- RLS Policy: Moderators can view all
CREATE POLICY "Moderators can view all"
ON public.reports FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'moderator'
);

-- RLS Policy: Moderators can update
CREATE POLICY "Moderators can update"
ON public.reports FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'moderator'
);

-- RLS Policy: Moderators can delete
CREATE POLICY "Moderators can delete"
ON public.reports FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'moderator'
);

-- Create public_reports view
CREATE OR REPLACE VIEW public.public_reports AS
SELECT
    id,
    created_at,
    link,
    platform,
    content_type,
    country,
    language,
    activity_status,
    report_count,
    report_id
FROM public.reports
WHERE status = 'approved';
```

### Step 6: Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**You should see:**
- ✅ Landing page loads
- ✅ NO 401 errors in console
- ✅ Public dashboard works
- ✅ Submit report form works

---

## ✅ Verification Checklist

After setup, verify everything works:

### 1. Check Environment Variables

Open browser console (F12) and run:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Both should show your actual values (not `undefined`).

### 2. Check Public Dashboard

Visit http://localhost:5173/reports/public

**Expected:**
- ✅ Page loads without errors
- ✅ No 401 errors in console
- ✅ Shows empty state or reports

**If you see 401 errors:**
- `.env` file is missing or incorrect
- Restart dev server after creating `.env`
- Check variable names have `VITE_` prefix

### 3. Test Report Submission

Visit http://localhost:5173/reports/create

**Expected:**
- ✅ Multi-step form loads
- ✅ Can fill out form
- ✅ Can submit report
- ✅ Success message shows with Report ID

### 4. Check Database

In Supabase Dashboard → **Table Editor** → **reports**

**Expected:**
- ✅ Your test report appears
- ✅ Status is `pending`
- ✅ Report ID is assigned

---

## 🐛 Troubleshooting

### Problem: 401 Unauthorized Errors

**Symptoms:**
```
GET https://xyz.supabase.co/rest/v1/reports?... 401 (Unauthorized)
Error fetching reports: Error: Failed to fetch reports
```

**Causes & Solutions:**

1. **No `.env` file**
   - Create `.env` in project root
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Wrong values in `.env`**
   - Double-check Project URL (should include `https://`)
   - Double-check Anon Key (long JWT token)
   - Get correct values from Supabase Dashboard → Settings → API

3. **Dev server not restarted**
   - Stop dev server (Ctrl+C)
   - Start again: `npm run dev`
   - Refresh browser

4. **Environment variables not loading**
   ```bash
   # Check if variables are set
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY

   # If empty, check .env file exists
   ls -la .env
   ```

### Problem: Empty Dashboard

**Symptoms:**
- No 401 errors
- Dashboard shows "No reports found"

**Solution:**
- This is normal if you haven't submitted any approved reports yet
- Submit a test report
- Create a moderator user (see below)
- Login as moderator
- Approve the test report
- Public dashboard should now show it

### Problem: Can't Access Moderator Dashboard

**Symptoms:**
- Login works but redirects back to login
- Can't see pending reports

**Solution:**
- Create a moderator user with correct role metadata:

```sql
-- In Supabase SQL Editor:
-- First, sign up via the app to create a user
-- Then run this to make them a moderator:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "moderator"}'::jsonb
WHERE email = 'your-email@example.com';
```

Or in Supabase Dashboard:
1. **Authentication** → **Users**
2. Click on your user
3. Edit **User Metadata**
4. Add: `{"role": "moderator"}`
5. Save

---

## 📁 File Structure

```
bright-pearl/
├── .env                     # ← YOU NEED TO CREATE THIS
├── .env.example             # ← Template (don't edit)
├── package.json
├── src/
│   ├── pages/
│   │   ├── landing/         # Landing page
│   │   ├── public-dashboard/ # Public reports
│   │   ├── reports/         # Submit form
│   │   └── moderator/       # Moderator dashboard
│   └── authProvider.ts      # Authentication logic
├── DATABASE_SCHEMA.md       # Full database reference
├── SETUP.md                 # Detailed setup guide
└── NETLIFY_DEPLOYMENT_CHECKLIST.md
```

---

## 🔐 Security Notes

### Safe to Commit

- ✅ `.env.example` (template only)
- ✅ All source code
- ✅ `package.json`, `package-lock.json`

### NEVER Commit

- ❌ `.env` file (contains your credentials)
- ❌ `node_modules/`
- ❌ `.DS_Store`, `.vscode/`

The `.gitignore` file is configured to prevent accidentally committing these files.

### Environment Variable Naming

- **`VITE_` prefix:** Exposed to browser (public)
  - Safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **No prefix:** Server-side only (secrets)
  - Dangerous: `SUPABASE_SERVICE_ROLE_KEY` (NEVER use in frontend!)

---

## 🎯 Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Make changes
# (Edit files in src/)

# 5. Test changes
# (Browser auto-reloads at http://localhost:5173)

# 6. Commit changes
git add .
git commit -m "Description of changes"
git push
```

### Before Committing

```bash
# Run type check
npm run type-check

# Run production build
npm run build

# Run tests (if any)
npm run test
```

---

## 📚 Additional Documentation

- **SETUP.md** - Comprehensive setup guide with deployment instructions
- **DATABASE_SCHEMA.md** - Complete database schema reference
- **FULL_SYSTEM_TEST_REPORT.md** - Production readiness test results
- **KNOWN_ISSUES.md** - Known issues and warnings
- **NETLIFY_DEPLOYMENT_CHECKLIST.md** - Deployment guide for Netlify

---

## ⚡ Common Development Tasks

### Add a New Report

1. Visit http://localhost:5173/reports/create
2. Fill out the form
3. Submit
4. Check in Supabase Table Editor → `reports` table

### Approve a Report (as Moderator)

1. Login as moderator (http://localhost:5173/login)
2. Visit http://localhost:5173/moderator/pending
3. Click "Details" on a pending report
4. Click "Approve"
5. Check public dashboard (http://localhost:5173/reports/public)

### Check Database

1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Select `reports` table
4. View/edit data directly

### Check Browser Console

Press **F12** (or Cmd+Option+I on Mac) to open DevTools:
- **Console:** View logs and errors
- **Network:** See API requests (including 401 errors)
- **Application → Local Storage:** View stored data

---

## 🆘 Still Having Issues?

### 1. Verify Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if .env file exists
ls -la .env

# Check .env contents (should have two lines)
cat .env
```

### 2. Fresh Install

```bash
# Remove dependencies
rm -rf node_modules package-lock.json

# Clear cache
rm -rf .vite

# Reinstall
npm install

# Restart dev server
npm run dev
```

### 3. Check Supabase Status

1. Login to [Supabase Dashboard](https://app.supabase.com/)
2. Check if project is "Healthy" (green status)
3. Go to **Settings** → **API**
4. Verify URL and anon key match your `.env` file
5. Check **Table Editor** → `reports` table exists

### 4. Enable Verbose Logging

Add to your `.env` file:

```bash
VITE_DEBUG=true
```

Restart dev server and check console for detailed logs.

---

## ✅ You're All Set!

If you've followed this guide and:
- ✅ `.env` file exists with correct credentials
- ✅ Dev server is running
- ✅ No 401 errors in browser console
- ✅ Landing page loads correctly

**Congratulations!** You're ready to develop on Bright Pearl.

---

**Last Updated:** 2025-11-11
**Status:** Local Development Guide
