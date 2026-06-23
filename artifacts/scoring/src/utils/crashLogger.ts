/**
 * Crash-Proof Logger
 * Writes logs to localStorage immediately so they survive crashes
 */

const LOG_KEY = 'vscor_crash_logs';
const MAX_LOGS = 200;

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  data?: any;
}

// Get existing logs
function getLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Write log immediately to localStorage
function writeLog(type: string, message: string, data?: any) {
  try {
    const logs = getLogs();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.stringify(data) : undefined,
    };
    
    logs.push(entry);
    
    // Keep only last MAX_LOGS entries
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    
    // Also console log
    const prefix = `[${type}] ${message}`;
    if (data) {
      console.log(prefix, data);
    } else {
      console.log(prefix);
    }
  } catch (err) {
    // If localStorage fails, at least console log
    console.error('Failed to write crash log:', err);
  }
}

// Public API
export const crashLog = {
  log: (message: string, data?: any) => writeLog('LOG', message, data),
  error: (message: string, data?: any) => writeLog('ERROR', message, data),
  warn: (message: string, data?: any) => writeLog('WARN', message, data),
  info: (message: string, data?: any) => writeLog('INFO', message, data),
  
  // Clear all logs
  clear: () => {
    localStorage.removeItem(LOG_KEY);
    console.log('🗑️ Crash logs cleared');
  },
  
  // Get all logs
  get: () => {
    return getLogs();
  },
  
  // Print all logs to console
  dump: () => {
    const logs = getLogs();
    console.log(`📋 === CRASH LOGS (${logs.length} entries) ===`);
    logs.forEach((log, i) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`${i + 1}. [${time}] [${log.type}] ${log.message}`);
      if (log.data) {
        try {
          console.log('   Data:', JSON.parse(log.data));
        } catch {
          console.log('   Data:', log.data);
        }
      }
    });
    console.log('📋 === END OF CRASH LOGS ===');
  },
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).crashLogs = crashLog;
}

// Log initialization
crashLog.info('Crash logger initialized. Access with: window.crashLogs.dump()');
