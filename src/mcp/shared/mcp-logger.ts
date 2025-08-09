/**
 * Enhanced MCP Logger with Token Tracking and Progress Reporting
 * Sends logs to stderr so they appear in Claude Code console
 */

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export class MCPLogger {
  private name: string;
  private tokenUsage: TokenUsage = { input: 0, output: 0, total: 0 };
  private startTime: number = Date.now();
  private lastProgressTime: number = Date.now();
  private progressInterval: NodeJS.Timeout | null = null;

  constructor(name: string) {
    this.name = name;
    // Start progress indicator
    this.startProgressIndicator();
  }

  /**
   * Log to stderr with proper formatting
   */
  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.name,
      message,
      data,
      tokens: this.tokenUsage.total,
      duration: Math.round((Date.now() - this.startTime) / 1000)
    };

    // Send to stderr so it appears in console
    console.error(`[${this.name}] ${level}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    
    // Also send structured log for potential parsing
    if (process.send) {
      process.send({
        type: 'log',
        data: logEntry
      });
    }
  }

  /**
   * Start progress indicator for long-running operations
   */
  private startProgressIndicator() {
    // Send progress every 2 seconds
    this.progressInterval = setInterval(() => {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      if (duration > 0) {
        this.progress(`Operation in progress... (${duration}s elapsed, ${this.tokenUsage.total} tokens used)`);
      }
    }, 2000);
  }

  /**
   * Stop progress indicator
   */
  public stopProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: any) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;
    this.log('ERROR', message, errorData);
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Log progress update
   */
  public progress(message: string) {
    // Only log progress if enough time has passed
    const now = Date.now();
    if (now - this.lastProgressTime > 1000) {
      this.lastProgressTime = now;
      console.error(`⏳ [${this.name}] ${message}`);
    }
  }

  /**
   * Track API call
   */
  public trackAPICall(operation: string, table?: string, recordCount?: number) {
    const message = `🔄 API Call: ${operation}${table ? ` on ${table}` : ''}${recordCount ? ` (${recordCount} records)` : ''}`;
    this.info(message);
    
    // Estimate token usage (rough approximation)
    const estimatedTokens = recordCount ? recordCount * 50 : 100;
    this.addTokens(estimatedTokens, 50);
  }

  /**
   * Add token usage
   */
  public addTokens(input: number, output: number) {
    this.tokenUsage.input += input;
    this.tokenUsage.output += output;
    this.tokenUsage.total = this.tokenUsage.input + this.tokenUsage.output;
    
    // Report token usage
    if (this.tokenUsage.total > 0) {
      console.error(`📊 [${this.name}] Tokens used: ${this.tokenUsage.total} (in: ${this.tokenUsage.input}, out: ${this.tokenUsage.output})`);
    }
  }

  /**
   * Log operation start
   */
  public operationStart(operation: string, params?: any) {
    this.startTime = Date.now();
    this.info(`🚀 Starting: ${operation} (tokens reset)`, params);
  }

  /**
   * Log operation complete
   */
  public operationComplete(operation: string, result?: any) {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    this.stopProgress();
    this.info(`✅ Completed: ${operation} (${duration}s, ${this.tokenUsage.total} tokens)`, result);
    
    // Send final token report
    if (this.tokenUsage.total > 0) {
      console.error(`
═══════════════════════════════════════════════════════════
📊 ${this.name} - Operation Complete
─────────────────────────────────────────────────────────
⏱️  Duration: ${duration} seconds
🔢 Tokens Used: ${this.tokenUsage.total}
   ├─ Input: ${this.tokenUsage.input}
   └─ Output: ${this.tokenUsage.output}
🎯 Operation: ${operation}
═══════════════════════════════════════════════════════════
      `);
    }
  }

  /**
   * Get token usage
   */
  public getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  /**
   * Reset token usage
   */
  public resetTokens() {
    this.tokenUsage = { input: 0, output: 0, total: 0 };
    console.error(`🔄 [${this.name}] Token counter reset for new operation`);
  }
}

/**
 * Create a singleton logger instance for consistent logging
 */
let globalLogger: MCPLogger | null = null;

export function getGlobalLogger(name?: string): MCPLogger {
  if (!globalLogger) {
    globalLogger = new MCPLogger(name || 'MCP-Server');
  }
  return globalLogger;
}

/**
 * Log formatter for consistent output
 */
export function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level.padEnd(5)} | ${message}${dataStr}`;
}