# Bright Pearl Edge Functions

This directory contains Supabase Edge Functions for Bright Pearl.

## Available Functions

### 1. submit-report
Handles public report submissions with validation and rate limiting.

**Endpoint:** `POST /functions/v1/submit-report`

**Features:**
- Rate limiting: 5 submissions per hour per IP (using Deno KV)
- IP hashing for privacy
- Input validation
- Automatic spam prevention

**Parameters:**
- `platform` (string, required): Platform where content was found
- `original_url` (string, required): URL to the content
- `title` (string, required): Title/summary of the report
- `description` (string, required): Detailed description
- `category` (enum, required): Type of violation
- `language` (string, required): ISO language code
- `country` (string, required): ISO country code
- `submitter_email` (string, optional): Email for status updates

**Response:**
- `200 OK`: Report submitted successfully
- `400 Bad Request`: Missing required fields
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### 2. moderate-report
Handles moderation actions (approve/reject/escalate) by moderators.

**Endpoint:** `POST /functions/v1/moderate-report`

**Headers:**
- `Authorization: Bearer <supabase-auth-token>`

**Features:**
- Moderator authentication check
- Automatic email notifications (if submitter provided email)
- Audit logging
- Status updates

**Parameters:**
- `report_id` (uuid, required): ID of the report to moderate
- `action` (enum, required): 'approve', 'reject', or 'escalate'
- `comment` (string, optional): Moderation notes

**Response:**
- `200 OK`: Report moderated successfully
- `400 Bad Request`: Invalid parameters
- `403 Forbidden`: Not a moderator
- `500 Internal Server Error`: Server error

### 3. send-notification
Sends email notifications to report submitters using SendGrid.

**Endpoint:** `POST /functions/v1/send-notification`

**Headers:**
- `Authorization: Bearer <supabase-auth-token>`

**Features:**
- HTML and plain text email templates
- SendGrid integration
- Graceful error handling

**Parameters:**
- `report_id` (uuid, required): ID of the report
- `submitter_email` (string, optional): Email to send notification to
- `action` (enum, required): 'approved' or 'rejected'
- `comment` (string, optional): Moderator notes to include

**Response:**
- `200 OK`: Notification sent successfully
- `500 Internal Server Error`: Failed to send notification

## Deployment

Deploy functions using the Supabase CLI:

```bash
supabase functions deploy submit-report
supabase functions deploy moderate-report
supabase functions deploy send-notification
```

Or deploy all at once:

```bash
supabase functions deploy
```

## Local Development

Run functions locally:

```bash
# Start all functions
supabase functions serve

# Or start specific function
supabase functions serve submit-report --no-verify-jwt
supabase functions serve moderate-report
supabase functions serve send-notification
```

Test locally:

```bash
# Test submit-report
curl -X POST http://localhost:54321/functions/v1/submit-report \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "original_url": "https://example.com",
    "title": "Test report",
    "description": "Test description",
    "category": "hate_speech",
    "language": "en",
    "country": "US"
  }'
```

## Environment Variables

Required environment variables (automatically set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Additional required variables (set via Supabase secrets):
- `SENDGRID_API_KEY` - For sending email notifications

Set secrets:
```bash
supabase secrets set SENDGRID_API_KEY=your_key_here
```

## Rate Limiting

The submit-report function implements IP-based rate limiting:
- **Limit:** 5 submissions per hour per IP
- **Storage:** Deno KV (persistent key-value store)
- **Privacy:** IPs are hashed using SHA-256

To adjust limits, edit the `checkRateLimit` function in [submit-report/index.ts](./submit-report/index.ts).

## Testing

### Submit Report
```bash
curl -X POST https://your-project.supabase.co/functions/v1/submit-report \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "original_url": "https://twitter.com/example",
    "title": "Test islamophobic post",
    "description": "Contains hate speech",
    "category": "hate_speech",
    "language": "en",
    "country": "US",
    "submitter_email": "reporter@example.com"
  }'
```

### Moderate Report (requires auth token)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/moderate-report \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "uuid-here",
    "action": "approve",
    "comment": "Verified as islamophobic content"
  }'
```

## TODO / Future Enhancements

- [x] Implement rate limiting using Deno KV
- [x] Create email notification function
- [ ] Add reCAPTCHA verification for submit-report
- [ ] Add function for updating platform_status
- [ ] Create analytics/stats generation function
- [ ] Implement webhook for platform API integrations
- [ ] Add batch moderation endpoint
