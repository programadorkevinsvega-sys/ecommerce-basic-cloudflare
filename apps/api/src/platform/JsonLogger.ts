import { TraceContext } from './TraceContext.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  service: string;
  module: string;
  level: LogLevel;
  trace_id: string;
  request_id: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class JsonLogger {
  private static readonly SENSITIVE_KEYS = new Set([
    'password', 'token', 'secret', 'authorization', 'cookie',
    'pan', 'cvv', 'card_number', 'security_code', 'api_key'
  ]);

  private readonly serviceName: string;
  private readonly moduleName: string;
  private readonly traceContext?: TraceContext;

  public constructor(moduleName: string, traceContext?: TraceContext, serviceName = 'ecommerce-api') {
    this.moduleName = moduleName;
    this.traceContext = traceContext;
    this.serviceName = serviceName;
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  public error(message: string, err?: unknown, data?: Record<string, unknown>): void {
    let errorObj: { name: string; message: string; stack?: string } | undefined;
    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (err) {
      errorObj = {
        name: 'UnknownError',
        message: String(err),
      };
    }
    this.log('error', message, data, errorObj);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      module: this.moduleName,
      level,
      trace_id: this.traceContext?.traceId || 'unknown',
      request_id: this.traceContext?.requestId || 'unknown',
      message,
      data: data ? this.sanitize(data) : undefined,
      error,
    };
    console.log(JSON.stringify(entry));
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (JsonLogger.SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
