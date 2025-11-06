// Comprehensive Logging System for Bright Pearl
// Structured logging with levels, context, and monitoring integration

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  moderatorId?: string;
  reportId?: number;
  action?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private context: LogContext = {};

  constructor(defaultContext?: LogContext) {
    if (defaultContext) {
      this.context = { ...defaultContext };
    }
  }

  // Set global context for all logs in this instance
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // Add temporary context for a single log
  private buildLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        ...additionalContext,
        environment: Deno.env.get('ENVIRONMENT') || 'development',
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private write(entry: LogEntry): void {
    // Console output (captured by Supabase)
    console.log(JSON.stringify(entry));

    // In production, you could also send to:
    // - Supabase Analytics
    // - External logging service (Datadog, LogRocket, etc.)
    // - Custom monitoring endpoint

    // Alert on critical errors
    if (entry.level === LogLevel.CRITICAL) {
      this.sendAlert(entry);
    }
  }

  private async sendAlert(entry: LogEntry): Promise<void> {
    // TODO: Implement alerting (email, Slack, PagerDuty, etc.)
    console.error('🚨 CRITICAL ALERT:', JSON.stringify(entry, null, 2));
  }

  // Log methods
  debug(message: string, context?: LogContext): void {
    this.write(this.buildLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.write(this.buildLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.write(this.buildLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.write(this.buildLogEntry(LogLevel.ERROR, message, context, error));
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.write(this.buildLogEntry(LogLevel.CRITICAL, message, context, error));
  }

  // Specialized logging methods for common scenarios

  logRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info('Request received', {
      method,
      endpoint,
      ...context,
    });
  }

  logResponse(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.write(
      this.buildLogEntry(
        level,
        'Request completed',
        {
          method,
          endpoint,
          status,
          duration,
          ...context,
        }
      )
    );
  }

  logAuthentication(success: boolean, userId?: string, reason?: string, context?: LogContext): void {
    if (success) {
      this.info('Authentication successful', { userId, ...context });
    } else {
      this.warn('Authentication failed', { userId, reason, ...context });
    }
  }

  logAuthorization(success: boolean, userId: string, resource: string, action: string, context?: LogContext): void {
    if (success) {
      this.info('Authorization granted', { userId, resource, action, ...context });
    } else {
      this.warn('Authorization denied', { userId, resource, action, ...context });
    }
  }

  logRateLimit(exceeded: boolean, key: string, limit: number, context?: LogContext): void {
    if (exceeded) {
      this.warn('Rate limit exceeded', { key, limit, ...context });
    } else {
      this.debug('Rate limit check passed', { key, limit, ...context });
    }
  }

  logValidationError(field: string, value: any, reason: string, context?: LogContext): void {
    this.warn('Validation error', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      reason,
      ...context,
    });
  }

  logDatabaseOperation(
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    success: boolean,
    duration?: number,
    context?: LogContext
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.write(
      this.buildLogEntry(
        level,
        `Database ${operation} on ${table}`,
        {
          operation,
          table,
          success,
          duration,
          ...context,
        }
      )
    );
  }

  logModeratorAction(
    moderatorId: string,
    action: string,
    reportId: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.info('Moderator action executed', {
      moderatorId,
      action,
      reportId,
      success,
      ...context,
    });
  }

  logSecurityEvent(
    eventType: 'suspicious_activity' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'csrf_attempt',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: string,
    context?: LogContext
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;

    this.write(
      this.buildLogEntry(
        level,
        `Security event: ${eventType}`,
        {
          eventType,
          severity,
          details,
          ...context,
        }
      )
    );
  }

  // Performance monitoring
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}

// Create request-scoped logger
export function createRequestLogger(req: Request): Logger {
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const url = new URL(req.url);

  return new Logger({
    requestId,
    ip,
    userAgent,
    endpoint: url.pathname,
    method: req.method,
  });
}

// Global logger for non-request contexts
export const globalLogger = new Logger({
  component: 'global',
});

// Metrics collection
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }

  log(): void {
    globalLogger.info('Metrics snapshot', { metrics: this.getMetrics() });
  }
}

export const metrics = new MetricsCollector();

// Health check logging
export function logHealthCheck(
  service: string,
  healthy: boolean,
  details?: Record<string, any>
): void {
  if (healthy) {
    globalLogger.debug(`Health check passed: ${service}`, details);
  } else {
    globalLogger.error(`Health check failed: ${service}`, undefined, details);
  }
}

// Startup logging
export function logStartup(functionName: string, version?: string): void {
  globalLogger.info(`Edge Function started: ${functionName}`, {
    version: version || '1.0.0',
    runtime: 'Deno',
    timestamp: new Date().toISOString(),
  });
}

// Shutdown logging
export function logShutdown(functionName: string, reason?: string): void {
  globalLogger.info(`Edge Function shutdown: ${functionName}`, {
    reason: reason || 'normal',
  });
}
