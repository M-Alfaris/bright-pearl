-- Monitoring and Alerting Queries for Bright Pearl
-- Run these periodically to monitor system health and security

-- 1. Failed Authentication Attempts (Last Hour)
-- Alert if > 10 failed attempts from same IP in 1 hour
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as failed_attempts,
  auth.audit_log_entries.ip_address
FROM auth.audit_log_entries
WHERE
  action = 'user_signedin' AND
  created_at > NOW() - INTERVAL '1 hour' AND
  payload->>'error' IS NOT NULL
GROUP BY hour, ip_address
HAVING COUNT(*) > 10
ORDER BY failed_attempts DESC;

-- 2. Suspicious Moderator Activity
-- Alert if moderator performs > 50 actions per hour
SELECT
  DATE_TRUNC('hour', ma.created_at) as hour,
  ma.moderator_id,
  u.email as moderator_email,
  COUNT(*) as action_count,
  COUNT(CASE WHEN ma.action = 'approve' THEN 1 END) as approvals,
  COUNT(CASE WHEN ma.action = 'reject' THEN 1 END) as rejections
FROM moderator_actions ma
JOIN auth.users u ON ma.moderator_id = u.id
WHERE ma.created_at > NOW() - INTERVAL '1 hour'
GROUP BY hour, ma.moderator_id, u.email
HAVING COUNT(*) > 50
ORDER BY action_count DESC;

-- 3. High Report Count for Single Content
-- Alert if same content is reported > 20 times
SELECT
  id,
  content_link,
  platform,
  report_count,
  status,
  created_at
FROM reports
WHERE report_count > 20
ORDER BY report_count DESC
LIMIT 50;

-- 4. Pending Reports Backlog
-- Alert if > 100 pending reports or oldest pending > 72 hours
SELECT
  COUNT(*) as pending_count,
  MIN(created_at) as oldest_pending,
  EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))/3600 as hours_old
FROM reports
WHERE status = 'pending';

-- 5. Rate Limit Violations (from application logs)
-- This would be tracked in your logging system
-- Example structure for monitoring
/*
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  ip_hash,
  COUNT(*) as violations
FROM edge_function_logs
WHERE
  level = 'WARN' AND
  message LIKE '%Rate limit exceeded%' AND
  timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour, ip_hash
HAVING COUNT(*) > 5
ORDER BY violations DESC;
*/

-- 6. Database Performance Issues
-- Alert if queries taking > 5 seconds
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE
  (now() - pg_stat_activity.query_start) > interval '5 seconds' AND
  state = 'active'
ORDER BY duration DESC;

-- 7. Unusual Report Patterns
-- Alert if sudden spike in reports (> 2x normal rate)
WITH hourly_stats AS (
  SELECT
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as report_count
  FROM reports
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY hour
),
avg_rate AS (
  SELECT AVG(report_count) as avg_per_hour
  FROM hourly_stats
)
SELECT
  hs.hour,
  hs.report_count,
  ar.avg_per_hour,
  (hs.report_count / NULLIF(ar.avg_per_hour, 0)) as spike_ratio
FROM hourly_stats hs
CROSS JOIN avg_rate ar
WHERE
  hs.hour > NOW() - INTERVAL '24 hours' AND
  hs.report_count > (ar.avg_per_hour * 2)
ORDER BY spike_ratio DESC;

-- 8. Moderator Account Security
-- Check for moderators without proper role metadata
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role,
  last_sign_in_at
FROM auth.users
WHERE
  raw_user_meta_data->>'role' = 'moderator' OR
  (
    id IN (SELECT DISTINCT moderator_id FROM moderator_actions) AND
    (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'moderator')
  );

-- 9. Content Activity Tracking
-- Monitor ratio of active vs deleted content
SELECT
  platform,
  COUNT(*) as total_approved,
  COUNT(CASE WHEN activity_status = 'active' THEN 1 END) as still_active,
  COUNT(CASE WHEN activity_status = 'deleted' THEN 1 END) as deleted,
  ROUND(
    COUNT(CASE WHEN activity_status = 'deleted' THEN 1 END)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    2
  ) as deletion_rate_pct
FROM reports
WHERE status = 'approved'
GROUP BY platform
ORDER BY total_approved DESC;

-- 10. Audit Trail Gaps
-- Check for reports with actions but no audit log
SELECT
  r.id,
  r.status,
  r.updated_at,
  COUNT(ma.id) as audit_entries
FROM reports r
LEFT JOIN moderator_actions ma ON r.id = ma.report_id
WHERE
  r.status IN ('approved', 'rejected') AND
  r.updated_at > NOW() - INTERVAL '30 days'
GROUP BY r.id, r.status, r.updated_at
HAVING COUNT(ma.id) = 0
ORDER BY r.updated_at DESC;

-- 11. Health Check - Overall System Status
SELECT
  'Total Reports' as metric,
  COUNT(*)::text as value
FROM reports
UNION ALL
SELECT
  'Pending Reports',
  COUNT(*)::text
FROM reports
WHERE status = 'pending'
UNION ALL
SELECT
  'Approved Reports',
  COUNT(*)::text
FROM reports
WHERE status = 'approved'
UNION ALL
SELECT
  'Active Moderators (Last 7 Days)',
  COUNT(DISTINCT moderator_id)::text
FROM moderator_actions
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'Reports Last 24h',
  COUNT(*)::text
FROM reports
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'Avg Reports per Hour (Last 7 Days)',
  ROUND(COUNT(*)::numeric / 168, 2)::text
FROM reports
WHERE created_at > NOW() - INTERVAL '7 days';

-- 12. Create a monitoring view for dashboard
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE created_at > NOW() - INTERVAL '24 hours') as reports_last_24h,
  (SELECT COUNT(DISTINCT moderator_id) FROM moderator_actions WHERE created_at > NOW() - INTERVAL '7 days') as active_moderators,
  (SELECT MAX(report_count) FROM reports) as max_report_count,
  (SELECT AVG(report_count) FROM reports) as avg_report_count,
  (
    SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))/3600
    FROM reports
    WHERE status = 'pending'
  ) as oldest_pending_hours;

-- Grant access to monitoring view
GRANT SELECT ON monitoring_dashboard TO authenticated;

COMMENT ON VIEW monitoring_dashboard IS 'Real-time monitoring metrics for system health';
