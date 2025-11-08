# Load Testing Suite - Bright Pearl

Comprehensive load testing scripts to establish baseline performance, identify bottlenecks, and validate system capacity.

---

## Overview

This directory contains load testing scripts using two popular tools:

- **Artillery**: Easy-to-use, YAML-based load testing
- **k6**: High-performance, JavaScript-based load testing

Both tools test the same scenarios from different perspectives to give comprehensive insights.

---

## Quick Start

### Option 1: k6 Quick Baseline Test (Recommended First)

```bash
# Install k6
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Run quick 2-minute test
k6 run load-tests/k6-quick-test.js

# Or specify your domain
k6 run --env BASE_URL=https://your-supabase-url.supabase.co/functions/v1 \
       --env ORIGIN=https://your-domain.com \
       load-tests/k6-quick-test.js
```

**Output**: Creates `load-test-summary.html` with visual results

---

## Installation

### Install Artillery

```bash
npm install -g artillery
```

### Install k6

See [k6 Installation Guide](https://k6.io/docs/getting-started/installation/)

---

## Test Scenarios

All tests simulate realistic user behavior:

### 1. Submit Report (40% of traffic)
- POST to `/submit-report-v2`
- Random platforms, content types, countries
- Tests rate limiting
- Validates response format

### 2. Get Public Reports (50% of traffic)
- GET from `/get-public-reports`
- Tests pagination, filtering, sorting
- Read-heavy workload
- Tests database query performance

### 3. Moderator Actions (10% of traffic)
- POST to `/approve-report` and `/update-status`
- Requires authentication
- Tests authorization logic
- Simulates admin workload

---

## Test Types

### Baseline Test
**Purpose**: Establish normal performance metrics

**Load**: 5-10 concurrent users
**Duration**: 2-5 minutes
**Use**: First test to run, creates performance baseline

```bash
k6 run load-tests/k6-quick-test.js
```

### Load Test
**Purpose**: Simulate normal production traffic

**Load**: 50 concurrent users
**Duration**: 30 minutes
**Use**: Verify system handles expected traffic

```bash
k6 run --vus 50 --duration 30m load-tests/k6-load-test.js
```

### Stress Test
**Purpose**: Find system breaking point

**Load**: 100-200 concurrent users
**Duration**: 30 minutes
**Use**: Identify maximum capacity and bottlenecks

```bash
k6 run load-tests/k6-load-test.js
# (Uses stress_test scenario automatically)
```

### Spike Test
**Purpose**: Test sudden traffic surge handling

**Load**: 0 → 1000 users in 1 minute
**Duration**: 5 minutes
**Use**: Validate auto-scaling and graceful degradation

```bash
k6 run load-tests/k6-load-test.js
# (Uses spike_test scenario automatically)
```

---

## Running Tests

### Artillery

#### Basic Test
```bash
artillery run load-tests/artillery-config.yml
```

#### Custom Target
```bash
artillery run \
  --target https://your-supabase-url.supabase.co/functions/v1 \
  load-tests/artillery-config.yml
```

#### With Environment Variables
```bash
export MODERATOR_TOKEN="your-jwt-token"
export TEST_ORIGIN="https://your-domain.com"
artillery run load-tests/artillery-config.yml
```

#### Quick Test (Reduced Duration)
```bash
artillery quick \
  --count 10 \
  --num 100 \
  https://your-supabase-url.supabase.co/functions/v1/get-public-reports
```

### k6

#### Quick Baseline
```bash
k6 run load-tests/k6-quick-test.js
```

#### Full Load Test
```bash
k6 run load-tests/k6-load-test.js
```

#### Custom VUs and Duration
```bash
k6 run --vus 100 --duration 10m load-tests/k6-load-test.js
```

#### With Environment Variables
```bash
k6 run \
  --env BASE_URL=https://your-supabase-url.supabase.co/functions/v1 \
  --env MODERATOR_TOKEN=your-jwt-token \
  --env ORIGIN=https://your-domain.com \
  load-tests/k6-load-test.js
```

#### Save Results to JSON
```bash
k6 run --out json=results.json load-tests/k6-load-test.js
```

#### Live Monitoring with Cloud
```bash
# Sign up at k6.io/cloud
k6 login cloud
k6 cloud load-tests/k6-load-test.js
```

---

## Configuration

### Update Test Targets

#### Artillery (`artillery-config.yml`)
```yaml
config:
  target: "https://your-supabase-url.supabase.co/functions/v1"
  variables:
    moderatorToken: "YOUR_MODERATOR_JWT_TOKEN"
    testOrigin: "https://your-frontend-domain.com"
```

#### k6 (`k6-load-test.js`)
```javascript
const BASE_URL = __ENV.BASE_URL || 'https://your-supabase-url.supabase.co/functions/v1';
const MODERATOR_TOKEN = __ENV.MODERATOR_TOKEN || 'YOUR_MODERATOR_JWT_TOKEN';
const ORIGIN = __ENV.ORIGIN || 'https://your-frontend-domain.com';
```

### Get Moderator Token

```bash
# Login as moderator in your app
# Open browser console
# Run:
const { data } = await supabase.auth.getSession()
console.log(data.session.access_token)

# Copy the token and use it in tests
```

---

## Interpreting Results

### Key Metrics

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Response Time (p95)** | < 500ms | < 1000ms | > 1000ms |
| **Response Time (p99)** | < 1000ms | < 2000ms | > 2000ms |
| **Error Rate** | < 0.1% | < 1% | > 1% |
| **Requests/Second** | Varies | Varies | Declining |
| **Rate Limit Hits** | 0 | < 5% | > 5% |

### Artillery Output

```
Summary report @ 14:23:45(+0000)
  Scenarios launched:  3000
  Scenarios completed: 2995
  Requests completed:  8985
  Mean response/sec:   50.2
  Response time (msec):
    min: 45
    max: 2340
    median: 150
    p95: 450    ← Should be < 1000ms
    p99: 890    ← Should be < 2000ms
  Scenario counts:
    Submit Report: 1200 (40%)
    Get Public Reports: 1500 (50%)
    Moderator Actions: 300 (10%)
  Codes:
    201: 1200   ← Successful submissions
    200: 1785   ← Successful GETs
    429: 15     ← Rate limited (track this)
    500: 5      ← Errors (should be < 1%)
```

### k6 Output

```
     ✓ submit: status is 201
     ✓ submit: has reportId
     ✓ get reports: status is 200
     ✓ get reports: has reports array
     ✓ moderator: status is 200 or 404

     checks.........................: 98.5%  ← Should be > 95%
     http_req_duration..............: avg=245ms p95=580ms  ← p95 < 1s is good
     http_req_failed................: 1.2%   ← Should be < 1%
     http_reqs......................: 12453  ← Total requests
     rate_limit_hits................: 23     ← Track this
     vus............................: 50     ← Concurrent users
     vus_max........................: 50
```

### What to Look For

#### ✅ Good Signs
- p95 response time < 1 second
- Error rate < 1%
- Consistent response times throughout test
- No timeout errors
- Rate limiting working correctly (429 responses)

#### ⚠️ Warning Signs
- p95 response time 1-2 seconds
- Error rate 1-5%
- Response times increasing over time
- Occasional timeouts
- High rate limit hit rate (> 5%)

#### 🔴 Critical Issues
- p95 response time > 2 seconds
- Error rate > 5%
- Response times degrading significantly
- Frequent timeouts (> 1%)
- Database connection errors
- 500 errors (server errors)

---

## Troubleshooting

### High Response Times

**Possible Causes**:
- Database queries not optimized
- No caching
- Cold starts (Edge Functions)
- Insufficient database connections

**Solutions**:
1. Check `SCALABILITY_ASSESSMENT.md` → Database Optimization
2. Add indexes to frequently queried columns
3. Implement caching layer
4. Upgrade Supabase plan for more connections

### High Error Rate

**Possible Causes**:
- Rate limiting too strict
- Database connection pool exhausted
- Edge Function timeouts
- CORS issues

**Solutions**:
1. Check error types in logs: `supabase functions logs submit-report-v2`
2. Review rate limiting configuration
3. Check database connection pool size
4. Verify CORS settings

### Rate Limit Hits

**Expected**: Some rate limit hits are normal and healthy (shows rate limiting works)

**Too Many**: If > 5% of requests are rate limited:
1. Review rate limits in `supabase/functions/_shared/security.ts`
2. Consider tiered rate limiting
3. Implement user-based limits vs. IP-based

### Connection Errors

**Symptoms**: "Connection refused", "ECONNRESET"

**Solutions**:
1. Check Supabase plan limits
2. Verify Edge Functions are deployed
3. Check firewall/network settings
4. Reduce concurrent users in test

---

## Best Practices

### 1. Start Small
```bash
# Always run quick baseline first
k6 run load-tests/k6-quick-test.js

# Then gradually increase load
k6 run --vus 10 --duration 5m load-tests/k6-load-test.js
k6 run --vus 50 --duration 10m load-tests/k6-load-test.js
k6 run --vus 100 --duration 20m load-tests/k6-load-test.js
```

### 2. Test Off-Peak Hours
- Don't run stress tests during peak production hours
- Schedule tests during low-traffic periods
- Consider using a staging environment

### 3. Monitor Database
```sql
-- Run this during load test to monitor database
SELECT * FROM monitoring_dashboard;

-- Check slow queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 seconds'
ORDER BY duration DESC;
```

### 4. Save Results
```bash
# k6 - save JSON results
k6 run --out json=results-$(date +%Y%m%d).json load-tests/k6-load-test.js

# Artillery - save report
artillery run --output report-$(date +%Y%m%d).json load-tests/artillery-config.yml
artillery report report-$(date +%Y%m%d).json
```

### 5. Compare Over Time
- Run baseline test weekly
- Track metrics in spreadsheet
- Look for performance regression
- Celebrate improvements!

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Weekly Load Test

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run baseline test
        run: |
          k6 run \
            --env BASE_URL=${{ secrets.SUPABASE_FUNCTIONS_URL }} \
            --env ORIGIN=${{ secrets.FRONTEND_URL }} \
            --out json=load-test-results.json \
            load-tests/k6-quick-test.js

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: load-test-results.json

      - name: Check thresholds
        run: |
          # Fail if error rate > 5%
          # Fail if p95 > 2000ms
          # (k6 will exit with error if thresholds fail)
```

---

## Expected Capacity

Based on `SCALABILITY_ASSESSMENT.md`:

| Traffic Level | Req/Day | Req/Sec | Expected Result |
|---------------|---------|---------|-----------------|
| **Low** | 10,000 | 0.12 | ✅ Pass all tests |
| **Medium** | 100,000 | 1.16 | ✅ Pass with optimization |
| **High** | 1,000,000 | 11.6 | ⚠️ Requires major optimization |
| **Very High** | 10,000,000 | 116 | ❌ Requires architectural changes |

### Test Recommendations by Tier

#### Low Traffic (10K req/day)
```bash
k6 run --vus 5 --duration 10m load-tests/k6-load-test.js
# Should pass all thresholds
```

#### Medium Traffic (100K req/day)
```bash
k6 run --vus 50 --duration 30m load-tests/k6-load-test.js
# May see some warnings, should not fail
```

#### High Traffic (1M req/day)
```bash
k6 run --vus 200 --duration 60m load-tests/k6-load-test.js
# Will likely fail without optimizations
```

---

## Next Steps After Testing

### If Tests Pass ✅
1. Document baseline metrics
2. Set up weekly automated tests
3. Create performance dashboard
4. Celebrate! 🎉

### If Tests Show Warnings ⚠️
1. Review `SCALABILITY_ASSESSMENT.md`
2. Implement Priority 1 optimizations
3. Add database indexes
4. Set up caching
5. Re-run tests

### If Tests Fail ❌
1. Check error logs: `supabase functions logs --tail`
2. Review database performance
3. Check connection pool usage
4. Implement immediate fixes from `SCALABILITY_ASSESSMENT.md`
5. Consider upgrading infrastructure
6. Re-run tests with lower load to find breaking point

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)
- `SCALABILITY_ASSESSMENT.md` - System capacity analysis
- `MONITORING_SETUP.md` - Logging and monitoring guide

---

## Support

If you encounter issues:

1. Check Supabase logs: `supabase functions logs --tail`
2. Review monitoring queries in `monitoring/supabase-alerts.sql`
3. Check database health: `SELECT * FROM monitoring_dashboard;`
4. Review `SCALABILITY_ASSESSMENT.md` for bottleneck analysis

---

**Last Updated**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Ready for Testing
