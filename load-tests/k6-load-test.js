// k6 Load Testing Script
// Bright Pearl - Report Submission System
//
// Installation:
//   https://k6.io/docs/getting-started/installation/
//
// Usage:
//   k6 run load-tests/k6-load-test.js
//   k6 run --vus 50 --duration 30m load-tests/k6-load-test.js
//   k6 run --out json=results.json load-tests/k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://iwdfzvfqbtokqetmbmbp.supabase.co/functions/v1';
const MODERATOR_TOKEN = __ENV.MODERATOR_TOKEN || 'YOUR_MODERATOR_JWT_TOKEN';
const ORIGIN = __ENV.ORIGIN || 'https://your-frontend-domain.com';

// Test configuration
export const options = {
  // Test scenarios
  scenarios: {
    // Baseline test
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      startTime: '0s',
      gracefulStop: '30s',
      tags: { test_type: 'baseline' },
    },

    // Load test - simulates normal traffic
    load_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '5m', target: 50 },   // Ramp up to 50 users
        { duration: '30m', target: 50 },  // Stay at 50 users
        { duration: '5m', target: 0 },    // Ramp down
      ],
      startTime: '5m',
      gracefulStop: '30s',
      tags: { test_type: 'load' },
    },

    // Stress test - find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },   // Ramp up to 100
        { duration: '10m', target: 100 },  // Stay at 100
        { duration: '5m', target: 200 },   // Ramp up to 200
        { duration: '10m', target: 200 },  // Stay at 200
        { duration: '5m', target: 0 },     // Ramp down
      ],
      startTime: '40m',
      gracefulStop: '30s',
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic surge
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1000 },  // Sudden spike
        { duration: '3m', target: 1000 },  // Hold
        { duration: '1m', target: 0 },     // Drop
      ],
      startTime: '75m',
      gracefulStop: '30s',
      tags: { test_type: 'spike' },
    },
  },

  // Thresholds - SLA requirements
  thresholds: {
    // 95% of requests should be below 1s
    'http_req_duration': ['p(95)<1000'],

    // 99% of requests should be below 2s
    'http_req_duration{test_type:load}': ['p(99)<2000'],

    // Error rate should be below 1%
    'http_req_failed': ['rate<0.01'],

    // Custom metrics
    'submit_report_duration': ['p(95)<1500'],
    'get_reports_duration': ['p(95)<800'],
    'moderator_action_duration': ['p(95)<1200'],
  },
};

// Custom metrics
const submitReportDuration = new Trend('submit_report_duration');
const getReportsDuration = new Trend('get_reports_duration');
const moderatorActionDuration = new Trend('moderator_action_duration');
const errorRate = new Rate('errors');
const rateLimitHits = new Counter('rate_limit_hits');

// Test data generators
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateReportData() {
  const platforms = ['YouTube', 'Facebook', 'Instagram', 'Twitter', 'TikTok'];
  const contentTypes = ['video', 'image', 'text', 'live_stream'];
  const countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'SA', 'AE'];
  const languages = ['en', 'ar', 'es', 'fr', 'de'];

  return {
    link: `https://example.com/content/${Math.random().toString(36).substring(7)}`,
    platform: randomElement(platforms),
    content_type: randomElement(contentTypes),
    description: `Load test report generated at ${new Date().toISOString()}`,
    country: randomElement(countries),
    language: randomElement(languages),
  };
}

// Main test function
export default function () {
  const testType = Math.random();

  // 40% - Submit reports
  if (testType < 0.4) {
    submitReport();
  }
  // 50% - Get public reports
  else if (testType < 0.9) {
    getPublicReports();
  }
  // 10% - Moderator actions
  else {
    moderatorActions();
  }

  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}

/**
 * Test: Submit Report
 */
function submitReport() {
  const payload = JSON.stringify(generateReportData());

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': ORIGIN,
    },
    tags: { endpoint: 'submit-report' },
  };

  const response = http.post(
    `${BASE_URL}/submit-report-v2`,
    payload,
    params
  );

  // Record duration
  submitReportDuration.add(response.timings.duration);

  // Checks
  const success = check(response, {
    'submit: status is 201': (r) => r.status === 201,
    'submit: has reportId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.reportId !== undefined;
      } catch {
        return false;
      }
    },
    'submit: response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    errorRate.add(1);
  }

  // Track rate limiting
  if (response.status === 429) {
    rateLimitHits.add(1);
  }
}

/**
 * Test: Get Public Reports
 */
function getPublicReports() {
  const page = Math.floor(Math.random() * 10) + 1;
  const limit = 50;
  const status = randomElement(['', 'pending', 'approved', 'rejected']);
  const platform = randomElement(['', 'YouTube', 'Facebook', 'Instagram']);

  let url = `${BASE_URL}/get-public-reports?page=${page}&limit=${limit}`;

  if (status) {
    url += `&status=${status}`;
  }

  if (platform) {
    url += `&platform=${platform}`;
  }

  const params = {
    headers: {
      'Origin': ORIGIN,
    },
    tags: { endpoint: 'get-public-reports' },
  };

  const response = http.get(url, params);

  // Record duration
  getReportsDuration.add(response.timings.duration);

  // Checks
  const success = check(response, {
    'get reports: status is 200': (r) => r.status === 200,
    'get reports: has reports array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.reports);
      } catch {
        return false;
      }
    },
    'get reports: response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  }

  // Track rate limiting
  if (response.status === 429) {
    rateLimitHits.add(1);
  }
}

/**
 * Test: Moderator Actions
 */
function moderatorActions() {
  const reportId = Math.floor(Math.random() * 1000) + 1;
  const action = randomElement(['approved', 'rejected']);

  const payload = JSON.stringify({
    report_id: reportId,
    action: action,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MODERATOR_TOKEN}`,
      'Origin': ORIGIN,
    },
    tags: { endpoint: 'approve-report' },
  };

  const response = http.post(
    `${BASE_URL}/approve-report`,
    payload,
    params
  );

  // Record duration
  moderatorActionDuration.add(response.timings.duration);

  // Checks (404 is acceptable if report doesn't exist)
  const success = check(response, {
    'moderator: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'moderator: response time < 1.5s': (r) => r.timings.duration < 1500,
  });

  if (!success && response.status !== 404) {
    errorRate.add(1);
  }

  // Track rate limiting
  if (response.status === 429) {
    rateLimitHits.add(1);
  }
}

/**
 * Setup - runs once before tests
 */
export function setup() {
  console.log('Starting load tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Origin: ${ORIGIN}`);
  return { startTime: new Date() };
}

/**
 * Teardown - runs once after tests
 */
export function teardown(data) {
  console.log('Load tests completed!');
  console.log(`Duration: ${(new Date() - data.startTime) / 1000}s`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

// Helper for text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n';

  summary += `${indent}✓ Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}✓ Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}✓ Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}✓ p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}✓ p99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;

  if (data.metrics.rate_limit_hits) {
    summary += `${indent}⚠ Rate Limit Hits: ${data.metrics.rate_limit_hits.values.count}\n`;
  }

  return summary;
}
