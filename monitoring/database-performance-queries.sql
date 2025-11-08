-- Database Performance Analysis Queries
-- Bright Pearl - PostgreSQL Performance Monitoring
--
-- These queries help identify performance bottlenecks and optimization opportunities
-- Run these regularly to monitor database health
-- ============================================================================

-- ============================================================================
-- QUERY PERFORMANCE ANALYSIS
-- ============================================================================

-- 1. Find slowest queries (requires pg_stat_statements extension)
-- Shows queries with highest average execution time
SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) as total_time_ms,
  ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
  ROUND(max_exec_time::numeric, 2) as max_time_ms,
  ROUND((100 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) as pct_total_time,
  LEFT(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%information_schema%'
  AND mean_exec_time > 10  -- Only queries averaging > 10ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 2. Most frequently executed queries
SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) as total_time_ms,
  ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
  ROUND((100 * calls / SUM(calls) OVER ())::numeric, 2) as pct_calls,
  LEFT(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- 3. Currently running queries
-- Useful for finding queries that are currently slow
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  state,
  wait_event_type,
  wait_event,
  LEFT(query, 200) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- 4. Long-running queries (> 5 seconds)
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  state,
  usename,
  datname,
  LEFT(query, 200) as query_preview
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

-- ============================================================================
-- INDEX ANALYSIS
-- ============================================================================

-- 5. Index usage statistics
-- Shows which indexes are actually being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
LIMIT 20;

-- 6. Unused indexes (potential candidates for removal)
-- Indexes that have never been scanned
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%pkey%'  -- Exclude primary keys
ORDER BY pg_relation_size(indexrelid) DESC;

-- 7. Missing indexes (sequential scans on large tables)
-- Tables that might benefit from indexes
SELECT
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as tuples_read,
  idx_scan as index_scans,
  n_live_tup as live_tuples,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND n_live_tup > 1000  -- Only tables with > 1000 rows
  AND seq_scan > idx_scan  -- More sequential than index scans
ORDER BY seq_tup_read DESC
LIMIT 10;

-- 8. Index bloat estimate
-- Shows indexes that might need rebuilding
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan,
  ROUND(100 * (pg_relation_size(indexrelid) - pg_relation_size(indexrelid, 'main'))::numeric /
    NULLIF(pg_relation_size(indexrelid), 0), 2) as bloat_pct
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 1024 * 1024  -- > 1MB
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- TABLE STATISTICS
-- ============================================================================

-- 9. Table sizes and row counts
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count,
  pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 10. Table bloat (dead tuples)
-- Shows tables that might need VACUUM
SELECT
  schemaname,
  tablename,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY n_dead_tup DESC
LIMIT 10;

-- 11. Most updated/inserted tables
SELECT
  schemaname,
  tablename,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_tup_hot_upd AS hot_updates,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans
FROM pg_stat_user_tables
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
LIMIT 10;

-- ============================================================================
-- DATABASE HEALTH
-- ============================================================================

-- 12. Database connections
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  ROUND(count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'), 2) as usage_pct
FROM pg_stat_activity;

-- 13. Connection pool usage by user
SELECT
  usename,
  count(*) as connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
GROUP BY usename
ORDER BY connections DESC;

-- 14. Database size
SELECT
  pg_database.datname as database_name,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS database_size
FROM pg_database
WHERE pg_database.datname = current_database();

-- 15. Cache hit ratio (should be > 95%)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  ROUND(sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- 16. Index cache hit ratio (should be > 95%)
SELECT
  sum(idx_blks_read) as index_read,
  sum(idx_blks_hit) as index_hit,
  ROUND(sum(idx_blks_hit) * 100.0 / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) AS index_cache_hit_ratio
FROM pg_statio_user_indexes;

-- ============================================================================
-- VACUUM & ANALYZE STATUS
-- ============================================================================

-- 17. Tables needing VACUUM
SELECT
  schemaname,
  tablename,
  n_dead_tup as dead_tuples,
  n_live_tup as live_tuples,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup, 0), 2) as dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000  -- More than 1000 dead tuples
  OR (n_dead_tup > 100 AND n_dead_tup * 100.0 / NULLIF(n_live_tup, 0) > 10)  -- Or > 10% dead
ORDER BY n_dead_tup DESC;

-- 18. Tables needing ANALYZE
SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  n_mod_since_analyze as modifications_since_analyze
FROM pg_stat_user_tables
WHERE n_mod_since_analyze > 1000  -- More than 1000 modifications
  OR last_analyze IS NULL
ORDER BY n_mod_since_analyze DESC;

-- ============================================================================
-- LOCK MONITORING
-- ============================================================================

-- 19. Current locks
SELECT
  locktype,
  database,
  relation::regclass as relation,
  mode,
  granted,
  pid
FROM pg_locks
WHERE NOT granted
ORDER BY relation;

-- 20. Blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ============================================================================
-- APPLICATION-SPECIFIC QUERIES
-- ============================================================================

-- 21. Bright Pearl - Reports table statistics
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_reports,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reports,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(DISTINCT platform) as platforms,
  COUNT(DISTINCT country) as countries,
  AVG(report_count) as avg_report_count,
  MAX(created_at) as latest_report,
  MIN(created_at) FILTER (WHERE status = 'pending') as oldest_pending
FROM reports;

-- 22. Bright Pearl - Most reported content
SELECT
  normalized_link,
  platform,
  content_type,
  report_count,
  status,
  MAX(created_at) as last_reported
FROM reports
WHERE report_count > 5
GROUP BY normalized_link, platform, content_type, report_count, status
ORDER BY report_count DESC
LIMIT 20;

-- 23. Bright Pearl - Moderator activity
SELECT
  moderator_id,
  action_type,
  COUNT(*) as action_count,
  MAX(created_at) as last_action
FROM moderator_actions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY moderator_id, action_type
ORDER BY action_count DESC;

-- 24. Bright Pearl - Platform distribution
SELECT
  platform,
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  ROUND(AVG(report_count), 2) as avg_report_count
FROM reports
GROUP BY platform
ORDER BY total_reports DESC;

-- ============================================================================
-- PERFORMANCE RECOMMENDATIONS
-- ============================================================================

-- 25. Generate index recommendations
-- Based on sequential scans vs index scans
SELECT
  schemaname,
  tablename,
  'CREATE INDEX idx_' || tablename || '_recommend ON ' || tablename || '(column_name);' as recommendation,
  seq_scan as sequential_scans,
  seq_tup_read as rows_scanned,
  idx_scan as index_scans
FROM pg_stat_user_tables
WHERE seq_scan > 1000  -- Many sequential scans
  AND seq_scan > idx_scan * 10  -- Way more sequential than index scans
  AND n_live_tup > 5000  -- Table has substantial data
ORDER BY seq_tup_read DESC;

-- ============================================================================
-- MAINTENANCE COMMANDS
-- ============================================================================

-- Run these during maintenance windows

-- Analyze all tables (update statistics)
-- ANALYZE;

-- Vacuum specific table
-- VACUUM ANALYZE reports;

-- Reindex specific index (if bloated)
-- REINDEX INDEX idx_reports_status;

-- Reindex all indexes on a table
-- REINDEX TABLE reports;

-- Reset pg_stat_statements
-- SELECT pg_stat_statements_reset();

-- ============================================================================
-- MONITORING SCHEDULE RECOMMENDATIONS
-- ============================================================================

-- Daily:
-- - Query #12: Database connections
-- - Query #15-16: Cache hit ratios
-- - Query #21: Application statistics

-- Weekly:
-- - Query #1: Slowest queries
-- - Query #5: Index usage
-- - Query #10: Table bloat
-- - Query #17-18: Vacuum/Analyze status

-- Monthly:
-- - Query #6: Unused indexes
-- - Query #7: Missing indexes
-- - Query #25: Index recommendations
-- - Full table/index statistics review

-- ============================================================================
-- ALERTS TO SET UP
-- ============================================================================

-- Alert if:
-- - Cache hit ratio < 95% (Query #15-16)
-- - Connection pool usage > 80% (Query #12)
-- - Any query > 5 seconds (Query #4)
-- - Dead tuples > 10% (Query #10)
-- - Any blocking queries (Query #20)

-- ============================================================================
-- OPTIMIZATION TARGETS
-- ============================================================================

-- Good Performance:
-- - Cache hit ratio: > 99%
-- - Index scans: > 90% of all scans
-- - Dead tuples: < 5%
-- - Connection pool: < 70% utilization
-- - Average query time: < 100ms
-- - p95 query time: < 500ms
-- - No queries > 5 seconds

-- ============================================================================
