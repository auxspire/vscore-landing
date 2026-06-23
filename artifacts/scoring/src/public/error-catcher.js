/**
 * Ultra-early error catcher - runs before React
 * This catches errors that happen during module loading
 */

(function() {
  console.log('🛡️ Ultra-early error catcher loaded');
  
  // Store all errors in memory
  window.__vsco_errors = [];
  window.__vscor_logs = [];
  
  // Create visual error display
  function showError(error, source) {
    console.error('🚨 ULTRA-EARLY ERROR CAUGHT:', error);
    console.error('🚨 Source:', source);
    
    // Store error
    window.__vscor_errors.push({
      error: error,
      source: source,
      time: new Date().toISOString()
    });
    
    // Create or update error banner
    let banner = document.getElementById('ultra-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ultra-error-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #dc2626;
        color: white;
        padding: 20px;
        font-family: monospace;
        font-size: 14px;
        z-index: 999999;
        max-height: 80vh;
        overflow: auto;
      `;
      document.body.appendChild(banner);
    }
    
    // Format error message
    let errorMsg = '';
    if (typeof error === 'string') {
      errorMsg = error;
    } else if (error && error.message) {
      errorMsg = error.message;
    } else {
      errorMsg = String(error);
    }
    
    let stackMsg = '';
    if (error && error.stack) {
      stackMsg = error.stack;
    }
    
    banner.innerHTML = `
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">
        🚨 FATAL ERROR DETECTED
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Source:</strong> ${source}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Message:</strong> ${errorMsg}
      </div>
      ${stackMsg ? `
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; margin-bottom: 5px;">Stack Trace (click to expand)</summary>
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; overflow: auto;">${stackMsg}</pre>
        </details>
      ` : ''}
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">
        <strong>Debug Info:</strong><br>
        • Open Console (F12) and run: <code style="background: rgba(0,0,0,0.3); padding: 2px 4px;">console.log(window.__vscor_errors)</code><br>
        • Total errors caught: ${window.__vscor_errors.length}
      </div>
    `;
  }
  
  // Catch synchronous errors
  window.addEventListener('error', function(event) {
    showError(event.error || event.message, 'window.onerror');
    // Don't prevent default - let console also show it
  }, true); // Use capture phase to catch early
  
  // Catch promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    showError(event.reason, 'unhandledrejection');
    // Don't prevent default
  }, true);
  
  // Intercept console.error to catch early errors
  const originalError = console.error;
  console.error = function(...args) {
    // Store in our log
    window.__vscor_logs.push({
      type: 'error',
      args: args,
      time: new Date().toISOString()
    });
    
    // Call original
    originalError.apply(console, args);
    
    // If it looks like a critical error, show banner
    const errorStr = args.join(' ');
    if (errorStr.includes('require is not defined') || 
        errorStr.includes('Failed to resolve module') ||
        errorStr.includes('Cannot find module') ||
        errorStr.includes('Uncaught') ||
        errorStr.includes('SyntaxError')) {
      showError(errorStr, 'console.error');
    }
  };
  
  console.log('✅ Ultra-early error catcher initialized');
  console.log('📋 Errors will be stored in: window.__vscor_errors');
  console.log('📋 Logs will be stored in: window.__vscor_logs');
})();
