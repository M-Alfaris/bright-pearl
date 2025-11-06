# Monitoring & Logging Setup - Bright Pearl

Complete guide for setting up comprehensive monitoring, logging, and alerting for the Bright Pearl application.

---

## Overview

The Bright Pearl monitoring system provides:

- **Structured Logging** - JSON-formatted logs with context
- **Security Monitoring** - Real-time security event tracking
- **Performance Monitoring** - Response time and throughput metrics
- **Database Monitoring** - SQL queries for system health
- **Alerting** - Automated notifications for critical events

---

## Quick Start

### 1. Enable Logging in Edge Functions

Add logging to your Edge Functions:

```typescript
import { createRequestLogger } from '../_shared/logger.ts';

serve(async (req) => {
  const logger = createRequestLogger(req);
  const timer = logger.startTimer();

  logger.info('Processing request');

  try {
    // Your code here
    const result = await processRequest();

    logger.logResponse(req.method, '/your-endpoint', 200, timer());
    return result;
  } catch (error) {
    logger.error('Request failed', error);
    logger.logResponse(req.method, '/your-endpoint', 500, timer());
    throw error;
  }
});
```

### 2. View Logs

**Supabase Dashboard**:
```
Dashboard → Edge Functions → Select Function → Logs Tab
```

**CLI**:
```bash
# Real-time logs
supabase functions logs submit-report-v2 --tail

# Filter by level
supabase functions logs submit-report-v2 --tail | grep ERROR
```

### 3. Run Monitoring Queries

Execute queries from `monitoring/supabase-alerts.sql` in Supabase SQL Editor to check system health.

---

## Structured Logging

### Logger API

Located in `supabase/functions/_shared/logger.ts`

#### Creating a Logger

```typescript
// Request-scoped logger (recommended)
import { createRequestLogger } from '../_shared/logger.ts';
const logger = createRequestLogger(req);

// Global logger
import { globalLogger } from '../_shared/logger.ts';
globalLogger.info('Application started');
```

#### Log Levels

```typescript
logger.debug('Detailed debug info', { userId: '123' });
logger.info('General information', { action: 'login' });
logger.warn('Warning message', { threshold: 90 });
logger.error('Error occurred', error, { reportId: 456 });
logger.critical('Critical failure', error, { system: 'database' });
```

#### Specialized Logging Methods

**Request/Response Logging**:
```typescript
// Log incoming request
logger.logRequest('POST', '/api/submit-report');

// Log response with timing
const timer = logger.startTimer();
// ... process request ...
logger.logResponse('POST', '/api/submit-report', 200, timer());
```

**Authentication Logging**:
```typescript
// Successful authentication
logger.logAuthentication(true, userId);

// Failed authentication
logger.logAuthentication(false, userId, 'Invalid password');
```

**Authorization Logging**:
```typescript
// Authorized action
logger.logAuthorization(true, userId, 'reports', 'approve');

// Denied action
logger.logAuthorization(false, userId, 'reports', 'delete');
```

**Rate Limiting Logging**:
```typescript
logger.logRateLimit(false, ipHash, 5); // Allowed
logger.logRateLimit(true, ipHash, 5);  // Blocked
```

**Validation Logging**:
```typescript
logger.logValidationError('email', 'invalid@', 'Invalid email format');
```

**Database Logging**:
```typescript
logger.logDatabaseOperation('INSERT', 'reports', true, 45);
logger.logDatabaseOperation('SELECT', 'users', false, 2500);
```

**Moderator Action Logging**:
```typescript
logger.logModeratorAction(moderatorId, 'approve', reportId, true);
```

**Security Event Logging**:
```typescript
logger.logSecurityEvent(
  'sql_injection',
  'high',
  'Detected SQL injection attempt in content_type field',
  { ip: '192.168.1.1', payload: "'; DROP TABLE--" }
);
```

#### Log Context

Add persistent context to all logs:

```typescript
const logger = createRequestLogger(req);

logger.setContext({
  userId: '123',
  sessionId: 'abc-def',
});

// All subsequent logs will include this context
logger.info('User action'); // Includes userId and sessionId
```

### Log Format

All logs are JSON-formatted:

```json
{
  "timestamp": "2025-11-06T10:30:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "context": {
    "requestId": "uuid-here",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "endpoint": "/api/submit-report",
    "method": "POST",
    "userId": "123",
    "duration": 150,
    "status": 200,
    "environment": "production"
  }
}
```

For errors:

```json
{
  "timestamp": "2025-11-06T10:30:00.000Z",
  "level": "ERROR",
  "message": "Database query failed",
  "context": {
    "requestId": "uuid-here",
    "operation": "INSERT",
    "table": "reports"
  },
  "error": {
    "name": "PostgrestError",
    "message": "duplicate key value violates unique constraint",
    "stack": "Error: ...\n    at ..."
  }
}
```

---

## Metrics Collection

### Metrics Collector

```typescript
import { metrics } from '../_shared/logger.ts';

// Increment counter
metrics.increment('reports.submitted');
metrics.increment('reports.approved', 5);

// Set gauge value
metrics.gauge('reports.pending', 42);
metrics.gauge('response.time.avg', 250);

// Get all metrics
const allMetrics = metrics.getMetrics();

// Log metrics snapshot
metrics.log();

// Reset metrics
metrics.reset();
```

### Recommended Metrics

```typescript
// Request metrics
metrics.increment('requests.total');
metrics.increment(`requests.${req.method}`);
metrics.increment(`requests.status.${status}`);
metrics.gauge('requests.duration', duration);

// Business metrics
metrics.increment('reports.submitted');
metrics.increment('reports.approved');
metrics.increment('reports.rejected');
metrics.gauge('reports.pending', pendingCount);

// Error metrics
metrics.increment('errors.total');
metrics.increment(`errors.${errorType}`);
metrics.increment('errors.rate_limit');

// Security metrics
metrics.increment('security.rate_limit_exceeded');
metrics.increment('security.invalid_token');
metrics.increment('security.sql_injection_attempt');
```

---

## Database Monitoring

### Monitoring Queries

Location: `monitoring/supabase-alerts.sql`

#### 1. Failed Authentication Attempts

```sql
-- Alert if > 10 failed attempts from same IP in 1 hour
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as failed_attempts,
  ip_address
FROM auth.audit_log_entries
WHERE
  action = 'user_signedin' AND
  created_at > NOW() - INTERVAL '1 hour' AND
  payload->>'error' IS NOT NULL
GROUP BY hour, ip_address
HAVING COUNT(*) > 10;
```

#### 2. Suspicious Moderator Activity

```sql
-- Alert if moderator performs > 50 actions per hour
SELECT
  DATE_TRUNC('hour', ma.created_at) as hour,
  ma.moderator_id,
  u.email,
  COUNT(*) as action_count
FROM moderator_actions ma
JOIN auth.users u ON ma.moderator_id = u.id
WHERE ma.created_at > NOW() - INTERVAL '1 hour'
GROUP BY hour, ma.moderator_id, u.email
HAVING COUNT(*) > 50;
```

#### 3. System Health Dashboard

```sql
-- View overall system status
SELECT * FROM monitoring_dashboard;
```

### Running Queries

**Supabase Dashboard**:
1. Go to SQL Editor
2. Copy query from `monitoring/supabase-alerts.sql`
3. Run query
4. Save as snippet for reuse

**CLI**:
```bash
# Run query file
supabase db execute -f monitoring/supabase-alerts.sql

# Or specific query
supabase db execute --query "SELECT * FROM monitoring_dashboard"
```

### Scheduling Queries

Use Supabase Database Webhooks or pg_cron:

```sql
-- Install pg_cron (if not already installed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily health check at 9 AM
SELECT cron.schedule(
  'daily-health-check',
  '0 9 * * *',
  'SELECT * FROM monitoring_dashboard'
);
```

---

## Alerting

### Alert Thresholds

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Failed auth attempts | > 10/hour from same IP | Medium | Review logs, possible block |
| Moderator actions | > 50/hour | High | Review moderator activity |
| Pending reports | > 100 | Medium | Increase moderator capacity |
| Oldest pending | > 72 hours | High | Urgent moderation needed |
| Response time | > 5 seconds | High | Investigate performance |
| Error rate | > 5% | Critical | Investigate immediately |
| High report count | > 20 for same content | Medium | Review content |
| Database queries | > 5 seconds | High | Optimize query |

### Setting Up Alerts

#### Option 1: Supabase Email Alerts

1. Go to Supabase Dashboard → Settings → Alerts
2. Configure alerts for:
   - Function errors (> 5% error rate)
   - Database connection issues
   - High load

#### Option 2: External Monitoring (Recommended)

**Sentry** (Error Tracking):
```typescript
// Install Sentry SDK
import * as Sentry from "@sentry/deno";

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: Deno.env.get('ENVIRONMENT'),
});

// Capture errors
try {
  // code
} catch (error) {
  Sentry.captureException(error);
}
```

**Datadog** (Comprehensive Monitoring):
```bash
# Install Datadog agent on your server
# Configure Datadog to scrape Supabase logs

# Add custom metrics
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -d '{
    "series": [{
      "metric": "bright_pearl.reports.submitted",
      "points": [['"$(date +%s)"', 1]]
    }]
  }'
```

**PagerDuty** (On-Call Alerts):
1. Create PagerDuty service
2. Integrate with Sentry or Datadog
3. Set up escalation policies

#### Option 3: Custom Webhooks

```sql
-- Create webhook function
CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'event', TG_OP,
    'table', TG_TABLE_NAME,
    'data', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := 'https://your-webhook-url.com/alert',
    body := payload::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on suspicious activity
CREATE TRIGGER alert_high_report_count
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (NEW.report_count > 20)
  EXECUTE FUNCTION notify_webhook();
```

---

## Performance Monitoring

### Response Time Tracking

```typescript
const logger = createRequestLogger(req);
const timer = logger.startTimer();

// Process request
await processRequest();

// Log timing
const duration = timer();
logger.logResponse(req.method, endpoint, status, duration);

// Alert if slow
if (duration > 2000) {
  logger.warn('Slow request detected', { duration, endpoint });
}
```

### Database Performance

```sql
-- Find slow queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
ORDER BY duration DESC;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Edge Function Performance

View in Supabase Dashboard:
- Average response time
- Request count
- Error rate
- Memory usage
- Invocation count

---

## Security Monitoring

### Security Events to Monitor

1. **Failed Authentication**
   - Multiple failed login attempts
   - Invalid token usage
   - Expired token attempts

2. **Authorization Failures**
   - Non-moderators trying to access admin endpoints
   - Missing role metadata

3. **Rate Limiting**
   - IPs exceeding rate limits
   - Repeated violations

4. **Input Validation**
   - SQL injection attempts
   - XSS attempts
   - Invalid data formats

5. **Suspicious Patterns**
   - Rapid successive requests
   - Unusual request patterns
   - Automated bot behavior

### Security Logging Example

```typescript
// Detect and log SQL injection attempt
if (contentType.includes('DROP TABLE') || contentType.includes('--')) {
  logger.logSecurityEvent(
    'sql_injection',
    'critical',
    'SQL injection attempt detected',
    {
      field: 'content_type',
      value: contentType.substring(0, 100),
      ip: req.headers.get('x-forwarded-for'),
    }
  );

  metrics.increment('security.sql_injection_attempt');

  // Block and return error
  return createErrorResponse('Invalid input', 400, origin);
}
```

---

## Dashboard Setup

### Option 1: Supabase Dashboard

Built-in monitoring:
- Edge Function logs
- Database performance
- API usage
- Error rates

### Option 2: Grafana + Prometheus

1. Install Grafana and Prometheus
2. Configure Prometheus to scrape metrics
3. Create Grafana dashboards
4. Import Supabase dashboard templates

### Option 3: Custom Dashboard

Create monitoring view:

```sql
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending,
  (SELECT COUNT(*) FROM reports WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  (SELECT COUNT(DISTINCT moderator_id) FROM moderator_actions WHERE created_at > NOW() - INTERVAL '7 days') as active_mods;
```

Query in frontend:

```typescript
const { data } = await supabaseClient
  .from('monitoring_dashboard')
  .select('*')
  .single();

console.log('System Health:', data);
```

---

## Best Practices

### Logging

1. **Use appropriate log levels**
   - DEBUG: Detailed debugging info (development only)
   - INFO: Normal operations
   - WARN: Warnings that don't stop execution
   - ERROR: Errors that need attention
   - CRITICAL: System-breaking errors

2. **Include context**
   ```typescript
   // Good
   logger.info('Report approved', { reportId: 123, moderatorId: 'user-456' });

   // Bad
   logger.info('Report approved');
   ```

3. **Don't log sensitive data**
   ```typescript
   // Bad - logs password
   logger.debug('Login attempt', { email, password });

   // Good
   logger.debug('Login attempt', { email });
   ```

4. **Use structured logging**
   - Always use JSON format
   - Include timestamp, level, message, context
   - Makes logs searchable and parseable

### Monitoring

1. **Set realistic thresholds**
   - Don't alert on every minor issue
   - Tune thresholds based on actual traffic

2. **Monitor trends, not just absolutes**
   - Track rate of change
   - Compare to historical baselines

3. **Automate response**
   - Auto-scale on high load
   - Auto-block on security threats

4. **Review regularly**
   - Weekly review of monitoring data
   - Monthly threshold adjustments
   - Quarterly security audits

---

## Troubleshooting

### Logs Not Appearing

```bash
# Check function is deployed
supabase functions list

# Check logs are being generated
supabase functions logs your-function --tail

# Verify logger import
# Make sure: import { createRequestLogger } from '../_shared/logger.ts';
```

### Slow Queries

```sql
-- Enable query logging
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Check slow queries
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;
```

### High Memory Usage

```bash
# Check Edge Function memory
# In Supabase Dashboard → Edge Functions → Select Function → Metrics

# Optimize function
# - Reduce payload sizes
# - Stream large responses
# - Clean up resources
```

---

## Maintenance

### Daily Tasks

- [ ] Review critical and error logs
- [ ] Check system health dashboard
- [ ] Verify alert notifications are working

### Weekly Tasks

- [ ] Review all monitoring queries
- [ ] Analyze performance trends
- [ ] Check for security anomalies
- [ ] Review pending reports backlog

### Monthly Tasks

- [ ] Tune alert thresholds
- [ ] Optimize slow queries
- [ ] Archive old logs
- [ ] Review and update monitoring queries
- [ ] Security audit

---

## Resources

- [Supabase Logging Docs](https://supabase.com/docs/guides/functions/debugging)
- [Deno Logging Best Practices](https://deno.land/manual/examples/logging)
- [PostgreSQL Monitoring](https://www.postgresql.org/docs/current/monitoring.html)
- [Structured Logging Guide](https://www.datadoghq.com/blog/structured-logging/)

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Status**: ✅ Production Ready
