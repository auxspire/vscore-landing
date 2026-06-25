/**
 * Visual Error Display - Shows errors on screen even if console clears
 * Pure JavaScript version (no React dependencies)
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  type: 'error' | 'rejection';
}

let errorList: ErrorInfo[] = [];
let isInitialized = false;

// Create error display banner
function createErrorBanner(): HTMLDivElement | null {
  try {
    if (!document.body) {
      console.warn('[ErrorDisplay] document.body not ready yet');
      return null;
    }
    
    const banner = document.createElement('div');
    banner.id = 'vscor-error-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      cursor: pointer;
    `;
    
    document.body.appendChild(banner);
    return banner;
  } catch (err) {
    console.error('[ErrorDisplay] Failed to create banner:', err);
    return null;
  }
}

function updateErrorBanner() {
  let banner = document.getElementById('vscor-error-banner') as HTMLDivElement;
  
  if (errorList.length === 0) {
    if (banner) {
      banner.remove();
    }
    return;
  }
  
  if (!banner) {
    banner = createErrorBanner() as HTMLDivElement;
  }
  
  const latestError = errorList[errorList.length - 1];
  
  banner.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">
      🚨 ${errorList.length} Error${errorList.length > 1 ? 's' : ''} Detected
    </div>
    <div style="margin-bottom: 4px;">
      ${latestError.message}
    </div>
    <div style="font-size: 11px; margin-top: 8px; opacity: 0.8;">
      Open DevTools Console (F12) and run: <strong>showErrors()</strong>
    </div>
  `;
}

function addError(message: string, stack?: string, type: 'error' | 'rejection' = 'error') {
  errorList.push({
    message,
    stack,
    timestamp: new Date(),
    type,
  });
  
  updateErrorBanner();
}

// Initialize error display
export function initializeErrorDisplay() {
  if (isInitialized) {
    console.log('🛡️ [ErrorDisplay] Already initialized');
    return;
  }
  
  console.log('🛡️ [ErrorDisplay] Initializing visual error display...');

  // Intercept errors
  window.addEventListener('error', function(event) {
    console.error('🛡️ [ErrorDisplay] CAUGHT ERROR:', event);
    
    const message = event.error?.message || event.message || String(event);
    const stack = event.error?.stack;
    
    addError(message, stack, 'error');
  }, true);

  // Intercept promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🛡️ [ErrorDisplay] CAUGHT PROMISE REJECTION:', event.reason);
    
    const message = event.reason?.message || String(event.reason);
    const stack = event.reason?.stack;
    
    addError(message, stack, 'rejection');
  }, true);

  // Make errors accessible from console
  (window as any).__vscorErrors = errorList;
  (window as any).showErrors = () => {
    console.log(`\n❌ All errors (${errorList.length}):\n`);
    errorList.forEach((err, idx) => {
      const time = err.timestamp.toLocaleTimeString();
      console.error(`\n[${idx + 1}] [${time}] ${err.type}:`);
      console.error('Message:', err.message);
      if (err.stack) {
        console.error('Stack:', err.stack);
      }
    });
    
    if (errorList.length === 0) {
      console.log('✅ No errors recorded');
    }
  };

  console.log('✅ [ErrorDisplay] Visual error display initialized');
  console.log('   Run showErrors() to see all errors');
  isInitialized = true;
}

// Initialize immediately if DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeErrorDisplay);
  } else {
    initializeErrorDisplay();
  }
}