# Bright Pearl - Quick Start Guide

Get up and running in 15 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

### Create Project
1. Go to [supabase.com/dashboard](https://app.supabase.com)
2. Create new project
3. Wait ~2 minutes for setup

### Run Migrations
1. Open SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run
4. Repeat for `supabase/migrations/002_rls_policies.sql`

### Get Credentials
1. Go to Settings > API
2. Copy Project URL and anon key

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
```

## 4. Run the App

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 5. Create a Moderator Account

### In Supabase Dashboard:
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email/password
4. Click the user, edit "User Metadata"
5. Add: `{"role": "moderator"}`

### Or via SQL:
```sql
UPDATE auth.users
SET raw_user_meta_data = '{"role": "moderator"}'::jsonb
WHERE email = 'your@email.com';
```

## 6. Test It Out!

1. Visit the Public Dashboard (no login needed)
2. Click "All Reports" > "Create" to submit a report
3. Log in with moderator credentials
4. Go to "Moderator Queue" to approve/reject
5. Check Statistics page for analytics

## What's Next?

- Read [SETUP.md](./SETUP.md) for full setup details
- Deploy to Netlify (see deployment section in SETUP.md)
- Customize About and Policies pages
- Implement rate limiting (see TODO in Edge Functions)
- Add email notifications

## Common Issues

**Can't connect to Supabase?**
- Check .env has correct credentials
- Restart dev server after changing .env
- Ensure variables start with `VITE_`

**Can't see reports as moderator?**
- Verify user has `{"role": "moderator"}` in metadata
- Check RLS policies were applied

**Build errors?**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `npm install`

## File Structure

```
src/
├── pages/
│   ├── reports/          # CRUD for reports
│   ├── moderator/        # Review queue
│   ├── public-dashboard/ # Public view
│   ├── statistics/       # Analytics
│   ├── about/            # Info page
│   └── policies/         # Policies
├── types/schema.ts       # TypeScript types
└── App.tsx               # Main app & routes

supabase/
├── migrations/           # Database schema
└── functions/            # Edge functions
```

## Key Features

- ✅ Report submission form
- ✅ Public dashboard with filters
- ✅ Moderator review queue
- ✅ Statistics dashboard
- ✅ Row-level security
- ✅ Role-based access
- ⏳ Rate limiting (TODO)
- ⏳ Email notifications (TODO)
- ⏳ Screenshot uploads (TODO)

Happy building! 🚀
