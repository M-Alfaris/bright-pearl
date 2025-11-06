# Bright Pearl - Setup Guide

This guide will help you set up the Bright Pearl platform from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier is fine for development)
- Git (for version control)

## 1. Initial Setup

### Clone and Install Dependencies

```bash
cd "Bright Pearl"
npm install
```

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: `bright-pearl` (or your preferred name)
   - Database Password: (generate a strong password)
   - Region: (choose closest to your target audience)
4. Wait for the project to be created (~2 minutes)

### 2.2 Run Database Migrations

1. In your Supabase project dashboard, go to the SQL Editor
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire contents and paste into the Supabase SQL Editor
4. Click "Run" to execute the migration
5. Repeat for `supabase/migrations/002_rls_policies.sql`

**Alternatively, using Supabase CLI:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 2.3 Configure Environment Variables

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2.4 Deploy Edge Functions (Optional)

If you want to use the custom Edge Functions for enhanced security:

```bash
# Deploy submit-report function
supabase functions deploy submit-report

# Deploy moderate-report function
supabase functions deploy moderate-report
```

## 3. Authentication Setup

### 3.1 Enable Email Authentication

1. In Supabase dashboard, go to Authentication > Providers
2. Enable "Email" provider
3. Configure email templates (optional)

### 3.2 Create a Moderator Account

You have two options:

**Option A: Via Supabase Dashboard**
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. After creating, click on the user
5. Edit "User Metadata" (raw JSON) and add:
```json
{
  "role": "moderator"
}
```

**Option B: Via SQL**
```sql
-- First, sign up via the app to create the user
-- Then run this SQL to make them a moderator:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "moderator"}'::jsonb
WHERE email = 'moderator@example.com';
```

## 4. Storage Setup

1. In Supabase dashboard, go to Storage
2. The `screenshots` bucket should be created automatically by the RLS migration
3. If not, create it manually:
   - Name: `screenshots`
   - Public: No (keep private)

## 5. Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## 6. Deployment

### Option A: Deploy to Netlify

1. Push your code to GitHub
2. Go to [https://app.netlify.com](https://app.netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy!

### Option B: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables via Vercel dashboard
```

## 7. Post-Deployment Configuration

### 7.1 Update Supabase Auth Settings

1. In Supabase dashboard, go to Authentication > URL Configuration
2. Add your production URL to "Site URL"
3. Add your production URL to "Redirect URLs"

### 7.2 Configure Email Notifications (Optional)

If you want email notifications for report status updates:

1. Sign up for SendGrid or Postmark
2. Get your API key
3. Add to Supabase Edge Functions secrets:

```bash
supabase secrets set SENDGRID_API_KEY=your-key
```

## 8. Verification Checklist

- [ ] Database tables created successfully
- [ ] RLS policies applied
- [ ] Storage bucket created
- [ ] Environment variables configured
- [ ] Application runs locally
- [ ] Can create a report
- [ ] Can log in as moderator
- [ ] Can approve/reject reports
- [ ] Public dashboard displays approved reports
- [ ] Statistics page shows correct data

## 9. Next Steps

### Customization

- Update the About page with your organization's information
- Customize the Policies page to match your moderation guidelines
- Add your logo by replacing the AppIcon component
- Configure analytics (Google Analytics, Plausible, etc.)

### Security Enhancements

- Implement rate limiting (using Deno KV in Edge Functions)
- Add reCAPTCHA to the submission form
- Set up monitoring and alerts for suspicious activity
- Configure CORS policies in Supabase

### Features to Add

- Email notifications for submitters
- Bulk moderation actions
- Advanced filtering and search
- Data export for researchers
- API documentation
- Mobile app

## Troubleshooting

### "Invalid API key" error
- Check that your `.env` file has the correct Supabase credentials
- Make sure the environment variable names start with `VITE_`
- Restart the dev server after changing `.env`

### "Row Level Security" errors
- Verify that RLS policies were applied correctly
- Check that moderator users have the correct role in their metadata
- Review Supabase logs in the dashboard

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18 or higher
- Clear the build cache: `rm -rf node_modules/.vite`

## Support

For issues or questions:
- Check the documentation at `/docs`
- Review the project issues on GitHub
- Contact the development team

---

Built with Refine, Supabase, and Ant Design.
