# Bright Pearl

> A global platform to collect, verify, publish, and monitor islamophobic content across social platforms — enabling mass reporting, public transparency, and data for researchers, journalists, and activists.

Built with [Refine](https://github.com/refinedev/refine), Supabase, and Ant Design.

## Vision

Bright Pearl is a trusted, transparent, and scalable platform where anyone can submit suspected islamophobic content (video, image, post, tweet, or link) regardless of language or origin. Verified reports are published on a public dashboard showing platform, status (active/removed), takedown progress, and analytics — enabling coordinated reporting and evidence for research and advocacy.

## Features

### Public Features
- **Report Submission**: Submit islamophobic content with evidence (screenshots, URLs, descriptions)
- **Public Dashboard**: Browse verified reports with filtering by platform, country, language, and date
- **Statistics**: View aggregate data on reports, platform responses, and removal rates
- **Transparency**: Track the status of reported content (active/removed)

### Moderator Features
- **Review Queue**: Dedicated interface for reviewing pending submissions
- **Approval/Rejection**: Moderate reports with detailed notes and reasoning
- **Audit Trail**: Complete history of all moderation actions
- **Role-Based Access**: Secure, invite-only moderator access

### Technical Features
- **Row Level Security**: Supabase RLS policies for data protection
- **Edge Functions**: Serverless functions for secure CRUD operations
- **Rate Limiting**: Protection against abuse (to be implemented)
- **Privacy-First**: Minimal PII collection, hashed IPs, optional emails

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see SETUP.md)
cp .env.example .env

# Run development server
npm run dev
```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
bright-pearl/
├── src/
│   ├── pages/
│   │   ├── reports/          # Report CRUD pages
│   │   ├── moderator/        # Moderator queue
│   │   ├── public-dashboard/ # Public-facing dashboard
│   │   ├── statistics/       # Analytics & stats
│   │   ├── about/            # About page
│   │   └── policies/         # Content policies
│   ├── types/
│   │   └── schema.ts         # TypeScript types
│   └── utility/
│       └── supabaseClient.ts # Supabase configuration
├── supabase/
│   ├── migrations/           # Database migrations
│   └── functions/            # Edge functions
│       ├── submit-report/    # Public submission endpoint
│       └── moderate-report/  # Moderator actions
├── .env.example              # Environment template
└── SETUP.md                  # Detailed setup guide
```

## Technology Stack

- **Frontend**: React 19 + Vite
- **UI Framework**: Ant Design
- **Admin Framework**: Refine
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Serverless**: Supabase Edge Functions (Deno)
- **Deployment**: Netlify (recommended) or Vercel

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run start

# Run Refine CLI
npm run refine
```

### Database Migrations

Migrations are located in `supabase/migrations/`:
- `001_initial_schema.sql` - Core tables and indexes
- `002_rls_policies.sql` - Row Level Security policies

Apply migrations via Supabase dashboard SQL Editor or CLI:
```bash
supabase db push
```

### Edge Functions

Deploy Edge Functions to Supabase:
```bash
supabase functions deploy submit-report
supabase functions deploy moderate-report
```

## Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

**Recommended:** Deploy to Netlify for best performance and ease of use.

## Roadmap

### MVP (Current Phase)
- [x] Core database schema
- [x] Report submission flow
- [x] Moderator review interface
- [x] Public dashboard
- [x] Statistics page
- [x] RLS policies
- [ ] Rate limiting implementation
- [ ] Email notifications
- [ ] Screenshot upload to Supabase Storage

### Future Enhancements
- [ ] Advanced search and filtering
- [ ] Bulk moderation actions
- [ ] Data export API for researchers
- [ ] Multilingual interface
- [ ] Browser extension for quick reporting
- [ ] Mobile app
- [ ] ML-based content detection
- [ ] Integration with platform reporting APIs

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Privacy & Security

Bright Pearl is built with privacy and security as core principles:
- Minimal data collection
- IP hashing for abuse prevention
- Encrypted data storage
- Secure authentication
- Row-level security policies
- Regular security audits

See [src/pages/policies/](./src/pages/policies/index.tsx) for full privacy policy.

## Support

- Documentation: See [SETUP.md](./SETUP.md)
- Issues: Report bugs via GitHub Issues
- Contact: contact@brightpearl.org

## License

MIT

---

**Note**: This is an MVP implementation. Additional security features like rate limiting and reCAPTCHA need to be implemented before production deployment.
