/**
 * Debug Logger - Preserves logs even if console clears
 * 
 * This utility captures all console logs and stores them in memory
 * so you can retrieve them even after the console clears.
 */

interface LogEntry {
  timestamp: Date;
  type: 'log' | 'error' | 'warn' | 'info';
  args: any[];
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // Keep last 500 logs
  private originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
  };

  constructor() {
    try {
      this.interceptConsoleMethods();
      
      // Make logs accessible from browser console
      if (typeof window !== 'undefined') {
        (window as any).__vscorLogs = this;
      }
      
      this.originalConsole.log('🔍 Debug Logger initialized. Access logs with: window.__vscorLogs.getLogs()');
    } catch (err) {
      // Silently fail if initialization fails
      this.originalConsole.error('Failed to initialize debug logger:', err);
    }
  }

  private interceptConsoleMethods() {
    const self = this;

    console.log = function(...args: any[]) {
      self.addLog('log', args);
      self.originalConsole.log.apply(console, args);
    };

    console.error = function(...args: any[]) {
      self.addLog('error', args);
      self.originalConsole.error.apply(console, args);
    };

    console.warn = function(...args: any[]) {
      self.addLog('warn', args);
      self.originalConsole.warn.apply(console, args);
    };

    console.info = function(...args: any[]) {
      self.addLog('info', args);
      self.originalConsole.info.apply(console, args);
    };
  }

  private addLog(type: LogEntry['type'], args: any[]) {
    this.logs.push({
      timestamp: new Date(),
      type,
      args,
    });

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Public methods accessible from browser console
  public getLogs(filterType?: LogEntry['type']): LogEntry[] {
    if (filterType) {
      return this.logs.filter(log => log.type === filterType);
    }
    return this.logs;
  }

  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  public printLogs(count: number = 50) {
    const recentLogs = this.getRecentLogs(count);
    console.log(`\n📋 Last ${count} logs:\n`);
    recentLogs.forEach(log => {
      const time = log.timestamp.toLocaleTimeString();
      const icon = {
        log: '📝',
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
      }[log.type];
      
      this.originalConsole.log(`${icon} [${time}]`, ...log.args);
    });
  }

  public getErrors(): LogEntry[] {
    return this.logs.filter(log => log.type === 'error');
  }

  public printErrors() {
    const errors = this.getErrors();
    console.log(`\n❌ All errors (${errors.length}):\n`);
    errors.forEach(err => {
      const time = err.timestamp.toLocaleTimeString();
      this.originalConsole.error(`[${time}]`, ...err.args);
    });
  }

  public clear() {
    this.logs = [];
    console.log('🧹 Debug logs cleared');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public downloadLogs() {
    const logsJson = this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vscor-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('📥 Logs downloaded');
  }
}

// Initialize debug logger immediately
export const debugLogger = new DebugLogger();

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).showLogs = (count?: number) => debugLogger.printLogs(count);
  (window as any).showErrors = () => debugLogger.printErrors();
  (window as any).downloadLogs = () => debugLogger.downloadLogs();
  
  console.log(`
🔍 VScor Debug Tools Available:
   - showLogs(50)     Show last 50 logs
   - showErrors()     Show all errors
   - downloadLogs()   Download all logs as JSON
   - window.__vscorLogs.getLogs()  Get all logs programmatically
  `);
}