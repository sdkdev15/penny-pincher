export type LogLevel = "info" | "warn" | "error" | "debug";

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private context: string;

  constructor(context: string = "app") {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
    };
  }

  private output(log: LogMessage): void {
    const formatted = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.context}] ${log.message}`;
    
    if (process.env.NODE_ENV === "development") {
      switch (log.level) {
        case "info":
          console.log(formatted, log.data ?? "");
          break;
        case "warn":
          console.warn(formatted, log.data ?? "");
          break;
        case "error":
          console.error(formatted, log.data ?? "");
          break;
        case "debug":
          console.debug(formatted, log.data ?? "");
          break;
      }
    } else {
      // In production, always output errors and warnings
      if (log.level === "error" || log.level === "warn") {
        console.log(formatted, log.data ?? "");
      }
    }
  }

  info(message: string, data?: unknown): void {
    this.output(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: unknown): void {
    this.output(this.formatMessage("warn", message, data));
  }

  error(message: string, data?: unknown): void {
    this.output(this.formatMessage("error", message, data));
  }

  debug(message: string, data?: unknown): void {
    this.output(this.formatMessage("debug", message, data));
  }

  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

// Create default logger instance
export const logger = new Logger("penny-pincher");

// Create context-specific loggers
export const authLogger = logger.child("auth");
export const transactionLogger = logger.child("transactions");
export const categoryLogger = logger.child("categories");
export const userLogger = logger.child("users");