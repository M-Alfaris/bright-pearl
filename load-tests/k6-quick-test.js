// k6 Quick Baseline Test
// Run a quick 2-minute test to establish baseline performance
//
// Usage:
//   k6 run load-tests/k6-quick-test.js
//   k6 run --env BASE_URL=https://your-domain.com load-tests/k6-quick-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://iwdfzvfqbtokqetmbmbp.supabase.co/functions/v1';
const ORIGIN = __ENV.ORIGIN || 'https://bright-pearl.netlify.app';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],  // 95% of requests under 2s
    'http_req_failed': ['rate<0.05'],      // Less than 5% errors
  },
};

export default function () {
  // Test 1: Get public reports
  const getResponse = http.get(
    `${BASE_URL}/get-public-reports?page=1&limit=20`,
    {
      headers: { 'Origin': ORIGIN },
    }
  );

  check(getResponse, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test 2: Submit report
  const submitPayload = JSON.stringify({
    link: `https://example.com/test-${Date.now()}`,
    platform: 'YouTube',
    content_type: 'video',
    description: 'Quick baseline test',
    country: 'US',
    language: 'en',
  });

  const submitResponse = http.post(
    `${BASE_URL}/submit-report-v2`,
    submitPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Origin': ORIGIN,
      },
    }
  );

  check(submitResponse, {
    'POST status is 201 or 429': (r) => r.status === 201 || r.status === 429,
    'POST response time < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-summary.html': htmlReport(data),
  };
}
