# Testing Guide - Bright Pearl

Comprehensive guide for testing the Bright Pearl application, including unit tests, integration tests, E2E tests, and monitoring.

---

## Table of Contents

1. [Test Overview](#test-overview)
2. [Running Tests](#running-tests)
3. [Frontend Tests](#frontend-tests)
4. [Edge Function Tests](#edge-function-tests)
5. [Test Coverage](#test-coverage)
6. [Continuous Integration](#continuous-integration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Writing New Tests](#writing-new-tests)

---

## Test Overview

### Test Types

| Type | Technology | Location | Purpose |
|------|-----------|----------|---------|
| Unit Tests | Vitest + React Testing Library | `src/**/*.test.tsx` | Test individual components |
| Integration Tests | Deno Test | `supabase/functions/**/*.test.ts` | Test Edge Functions |
| E2E Tests | (Planned) Playwright | `e2e/` | Test user flows |
| Security Tests | Deno Test | `supabase/functions/_shared/security.test.ts` | Test security utilities |

### Coverage Goals

- **Frontend**: 70% minimum coverage (lines, functions, branches, statements)
- **Edge Functions**: 80% minimum coverage
- **Security utilities**: 95% minimum coverage

---

## Running Tests

### Quick Start

```bash
# Run all tests
npm run test:all

# Frontend tests only
npm test

# Frontend tests with UI
npm run test:ui

# Frontend tests with coverage
npm run test:coverage

# Edge Function tests only
npm run test:edge
```

### Watch Mode (Development)

```bash
# Watch mode for frontend tests
npm test -- --watch

# Run specific test file
npm test -- src/pages/reports/create.test.tsx

# Run tests matching pattern
npm test -- --grep "validation"
```

### Environment Setup for Tests

Tests require environment variables:

```bash
# Frontend tests use mock values from src/test/setup.ts
# Edge Function tests need real Supabase credentials

export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

npm run test:edge
```

---

## Frontend Tests

### Technology Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Assertions**: Vitest + @testing-library/jest-dom
- **User Interactions**: @testing-library/user-event
- **Mocking**: Vitest mocks

### Test Structure

```typescript
describe('Component Name', () => {
  it('should do something', () => {
    // Arrange
    render(<Component />);

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Running Frontend Tests

```bash
# All frontend tests
npm test

# Specific file
npm test src/pages/reports/create.test.tsx

# With coverage
npm run test:coverage

# UI mode (visual test runner)
npm run test:ui
```

### Coverage Report

Coverage reports are generated in `coverage/` directory:

```bash
npm run test:coverage

# Open coverage report
open coverage/index.html
```

### What's Tested

#### ✅ Report Creation Form (`src/pages/reports/create.test.tsx`)
- Form rendering
- Platform selection
- Content type selection (platform-specific)
- URL validation
- Required field validation
- Form submission
- Rate limit handling
- Success/error states
- Character limits

#### ✅ Supabase Client (`src/utility/supabaseClient.test.ts`)
- Environment variable validation
- URL format validation
- Error handling for missing credentials

### Test Best Practices

1. **Use data-testid sparingly** - Prefer semantic queries (getByRole, getByLabelText)
2. **Test user behavior, not implementation** - Test what users see and do
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Mock API calls, Supabase, etc.
5. **Use meaningful test descriptions** - `it('should validate URL format')` not `it('test 1')`

---

## Edge Function Tests

### Technology Stack

- **Test Runner**: Deno Test
- **Assertions**: Deno std/assert
- **HTTP Client**: Deno fetch API

### Running Edge Function Tests

```bash
# All Edge Function tests
npm run test:edge

# Or directly with Deno
cd supabase/functions
deno test --allow-net --allow-env

# Specific test file
deno test --allow-net --allow-env _shared/security.test.ts

# Watch mode
deno test --allow-net --allow-env --watch
```

### What's Tested

#### ✅ Security Utilities (`_shared/security.test.ts`)

**URL Validation** (10 tests):
- Valid HTTPS/HTTP URLs
- Invalid protocols (javascript:, data:, file:)
- URL length limits
- Invalid formats

**Platform Validation** (3 tests):
- Valid platforms (twitter, facebook, etc.)
- Invalid platforms
- Case sensitivity

**Country Code Validation** (4 tests):
- Valid ISO 3166-1 alpha-2 codes
- Lowercase rejection
- Length validation
- Number rejection

**Language Code Validation** (3 tests):
- Valid ISO 639-1 codes
- Uppercase rejection
- Length validation

**Content Type Validation** (4 tests):
- Valid content types
- Hyphens and underscores
- Length limits
- Special character rejection

**Description Validation** (3 tests):
- Valid descriptions
- Undefined allowed
- Length limits

**Report ID Validation** (5 tests):
- Positive integers
- Zero/negative rejection
- Non-integer rejection
- Type validation

**IP Hashing** (3 tests):
- Consistent hashing
- Different IPs produce different hashes
- Hex string format

**URL Normalization** (7 tests):
- UTM parameter removal
- fbclid removal
- Multiple tracking params
- Lowercase conversion
- Important param preservation
- Invalid URL handling

**Rate Limiting** (3 tests):
- First request allowed
- Limit enforcement
- Window reset

**Performance** (2 tests):
- URL validation speed
- Combined validation speed

**Security** (3 tests):
- SQL injection blocking
- XSS blocking
- Path traversal handling

#### ✅ Submit Report Integration Tests (`submit-report-v2/index.test.ts`)

**Successful Submissions** (2 tests):
- New report creation
- Duplicate detection and counting

**Validation Errors** (7 tests):
- Missing required fields
- Invalid URL
- Invalid platform
- Invalid country code
- Invalid language code
- Description too long
- Malicious URL protocols

**Rate Limiting** (1 test):
- 5 requests per hour enforcement

**CORS** (2 tests):
- CORS headers present
- OPTIONS preflight handling

**URL Normalization** (1 test):
- Tracking parameter removal

**Security** (2 tests):
- SQL injection attempts blocked
- XSS attempts blocked

**Request Size** (1 test):
- Large request body rejected

**Platform Support** (1 test):
- All platforms accepted

**Performance** (1 test):
- Response time < 2 seconds

### Test Best Practices

1. **Use unique test data** - Use timestamps or UUIDs to avoid conflicts
2. **Clean up after tests** - Delete test data if possible
3. **Test error cases** - Test both success and failure paths
4. **Test edge cases** - Boundary values, empty strings, null, etc.
5. **Test security** - Always test for injection, XSS, etc.

---

## Test Coverage

### Current Coverage

| Component | Coverage | Status |
|-----------|----------|--------|
| Security Utilities | 95%+ | ✅ Excellent |
| Submit Report Edge Function | 85%+ | ✅ Good |
| Report Create Component | 80%+ | ✅ Good |
| Supabase Client | 70%+ | ✅ Acceptable |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open in browser
open coverage/index.html
```

### Coverage Reports

Coverage reports show:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage
- Uncovered lines (highlighted)

### Improving Coverage

To improve coverage:

1. Identify uncovered lines in coverage report
2. Write tests for those code paths
3. Focus on critical paths first (error handling, edge cases)
4. Run coverage again to verify

---

## Continuous Integration

### GitHub Actions

CI pipeline runs on:
- Push to main, develop, or claude/* branches
- Pull requests to main or develop

### CI Jobs

1. **Type Check** - TypeScript type validation
2. **Lint** - ESLint code quality check
3. **Test Frontend** - Run all frontend tests with coverage
4. **Test Edge Functions** - Run all Edge Function tests
5. **Build** - Test production build
6. **Security Scan** - npm audit + Snyk (if configured)
7. **Dependency Review** - Check for vulnerable dependencies (PRs only)

### CI Configuration

Location: `.github/workflows/ci.yml`

### Running CI Locally

```bash
# Install Act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI locally
act push
```

### CI Badge

Add to README.md:

```markdown
![CI Status](https://github.com/M-Alfaris/bright-pearl/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

## Monitoring & Logging

### Structured Logging

Location: `supabase/functions/_shared/logger.ts`

**Usage**:

```typescript
import { createRequestLogger } from '../_shared/logger.ts';

const logger = createRequestLogger(req);

logger.info('Processing request', { userId: '123' });
logger.error('Failed to process', error, { reportId: 456 });
logger.warn('Rate limit approaching', { usage: 4, limit: 5 });
```

**Log Levels**:
- `DEBUG` - Detailed information for debugging
- `INFO` - General information
- `WARN` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical errors that need immediate attention

**Specialized Logging**:

```typescript
// Request/Response
logger.logRequest('POST', '/submit-report');
logger.logResponse('POST', '/submit-report', 200, 150);

// Authentication
logger.logAuthentication(true, userId);

// Authorization
logger.logAuthorization(false, userId, 'reports', 'approve');

// Rate Limiting
logger.logRateLimit(true, ipHash, 5);

// Validation
logger.logValidationError('url', 'not-a-url', 'Invalid format');

// Database
logger.logDatabaseOperation('INSERT', 'reports', true, 50);

// Moderator Actions
logger.logModeratorAction(modId, 'approve', reportId, true);

// Security Events
logger.logSecurityEvent('sql_injection', 'high', 'Blocked attempt');
```

### Viewing Logs

**Supabase Dashboard**:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select function
4. Click "Logs" tab

**CLI**:
```bash
# Real-time logs
supabase functions logs submit-report-v2 --tail

# Last 100 lines
supabase functions logs submit-report-v2 --limit 100
```

### Monitoring Queries

Location: `monitoring/supabase-alerts.sql`

**Run monitoring queries**:

```sql
-- In Supabase SQL Editor

-- Failed auth attempts
\i monitoring/supabase-alerts.sql

-- Or copy-paste specific queries from the file
```

**Queries Available**:
1. Failed authentication attempts
2. Suspicious moderator activity
3. High report count for single content
4. Pending reports backlog
5. Database performance issues
6. Unusual report patterns
7. Moderator account security
8. Content activity tracking
9. Audit trail gaps
10. Overall system health
11. Monitoring dashboard view

### Alerting (To Be Implemented)

**Recommended Tools**:
- **Supabase Alerts** - Built-in alerting
- **Sentry** - Error tracking and alerting
- **Datadog** - Comprehensive monitoring
- **PagerDuty** - On-call management

**Alert Triggers**:
- Failed authentication > 10 in 1 hour
- Moderator actions > 50 in 1 hour
- Pending reports > 100
- Oldest pending > 72 hours
- Response time > 5 seconds
- Error rate > 5%
- Critical log level

---

## Writing New Tests

### Frontend Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    // Mock API failure
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    render(<YourComponent />);
    // ... test error handling
  });
});
```

### Edge Function Test Template

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.220.0/assert/mod.ts";

Deno.test("function name - test description", async () => {
  const response = await fetch('http://localhost:54321/functions/v1/your-function', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get('SUPABASE_ANON_KEY'),
    },
    body: JSON.stringify({ test: 'data' }),
  });

  assertEquals(response.status, 200);

  const data = await response.json();
  assertExists(data.result);
});
```

---

## Test Checklist

Before deploying:

- [ ] All tests pass (`npm run test:all`)
- [ ] Coverage meets thresholds (70%+ frontend, 80%+ Edge Functions)
- [ ] No security test failures
- [ ] Build succeeds (`npm run build`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] CI pipeline passes
- [ ] Manual testing completed
- [ ] Monitoring queries work
- [ ] Logs are structured and useful

---

## Troubleshooting

### Tests Failing Locally

```bash
# Clear cache
rm -rf node_modules coverage .vitest
npm install

# Reset database (if using local Supabase)
supabase db reset

# Check environment variables
echo $VITE_SUPABASE_URL
```

### Deno Tests Failing

```bash
# Check Deno version
deno --version

# Update Deno
deno upgrade

# Check permissions
deno test --allow-all  # (not recommended for production)
```

### Coverage Not Generated

```bash
# Install coverage provider
npm install -D @vitest/coverage-v8

# Run with coverage
npm run test:coverage
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Deno Testing](https://deno.land/manual@v1.40.0/basics/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Status**: ✅ Complete
