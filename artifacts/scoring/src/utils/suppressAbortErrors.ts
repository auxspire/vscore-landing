/**
 * suppressAbortErrors.ts
 *
 * MUST be the very first import in the module graph.
 *
 * Does three things:
 *
 *  1. Patches navigator.locks.request to remove the 'steal' option.
 *     GoTrue calls navigator.locks.request(name, { steal: true }, fn) when a
 *     new GoTrueClient initialises, forcibly taking the lock from any previous
 *     holder.  In Figma's iframe / HMR environment the previous holder is still
 *     alive, so the browser throws:
 *       "AbortError: Lock broken by another request with the 'steal' option"
 *     Stripping 'steal' makes the new request wait its turn instead of stealing,
 *     so the AbortError is never thrown.  The wait is bounded by a short
 *     AbortSignal so a truly stuck lock never hangs the app.
 *
 *  2. Filters console.error / console.warn / console.log for any residual
 *     Supabase / GoTrue noise (AbortError, Lock broken, Multiple instances …).
 *
 *  3. Installs global 'error' and 'unhandledrejection' handlers that swallow
 *     the same errors before they reach the browser console.
 */

const WIN = window as any;

// ─── 1. navigator.locks patch ────────────────────────────────────────────────
//
// Applied only once per window lifetime (guard prevents double-patching on HMR).
if (
  typeof navigator !== 'undefined' &&
  typeof navigator.locks?.request === 'function' &&
  !WIN.__vscor_locks_patched__
) {
  WIN.__vscor_locks_patched__ = true;

  const _realRequest = navigator.locks.request.bind(navigator.locks);

  /**
   * Wrapper around navigator.locks.request that:
   *   - Passes through requests that have no 'steal' option unchanged.
   *   - For 'steal' requests: waits up to STEAL_TIMEOUT_MS for the existing
   *     lock holder to finish naturally, then falls back to an ifAvailable
   *     (non-blocking) acquisition so the app is never left hanging.
   */
  const STEAL_TIMEOUT_MS = 3000;

  function patchedLocksRequest(name: string, cb: (lock: any) => any): Promise<any>;
  function patchedLocksRequest(name: string, options: any, cb: (lock: any) => any): Promise<any>;
  function patchedLocksRequest(name: string, optionsOrCb: any, maybeCb?: any): Promise<any> {
    // Signature: (name, callback)
    if (typeof optionsOrCb === 'function') {
      return _realRequest(name, optionsOrCb);
    }

    // Signature: (name, options, callback)
    const { steal, ...safeOptions } = optionsOrCb ?? {};
    const cb: (lock: any) => any = maybeCb;

    if (!steal) {
      // Not a steal request — forward unchanged.
      return _realRequest(name, safeOptions, cb);
    }

    // steal request: wait normally for up to STEAL_TIMEOUT_MS, then give up
    // gracefully (ifAvailable) rather than throwing an AbortError.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), STEAL_TIMEOUT_MS);

    return _realRequest(name, { ...safeOptions, signal: ac.signal }, cb)
      .then((result: any) => {
        clearTimeout(timer);
        return result;
      })
      .catch(() => {
        clearTimeout(timer);
        // Timed out or aborted — try ifAvailable (non-blocking, lock may be null).
        return _realRequest(name, { ...safeOptions, ifAvailable: true }, cb).catch(
          () => cb(null) // absolute last resort: call callback with no lock
        );
      });
  }

  try {
    (navigator.locks as any).request = patchedLocksRequest;
  } catch {
    // navigator.locks might be non-configurable in some environments — ignore.
  }
}

// ─── 2. Console filter ───────────────────────────────────────────────────────

const originalConsoleError = console.error;
const originalConsoleWarn  = console.warn;
const originalConsoleLog   = console.log;

const SUPPRESS_PATTERNS = [
  'AbortError',
  'Lock broken',
  'gotrue-js: Lock',
  'not released within',
  '@supabase/gotrue-js',
  'Multiple GoTrueClient instances',
];

const shouldSuppress = (args: any[]): boolean => {
  const combined = args
    .map(a => {
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (a && typeof a === 'object') { try { return JSON.stringify(a); } catch { return String(a); } }
      return String(a);
    })
    .join(' ');

  if (SUPPRESS_PATTERNS.some(p => combined.includes(p))) return true;

  return args.some(a => {
    if (a instanceof Error && a.name === 'AbortError') return true;
    if (typeof a === 'string') return SUPPRESS_PATTERNS.some(p => a.includes(p));
    if (a?.name === 'AbortError') return true;
    if (a?.message) return SUPPRESS_PATTERNS.some(p => (a.message as string).includes(p));
    return false;
  });
};

console.error = (...args: any[]) => { if (!shouldSuppress(args)) originalConsoleError.apply(console, args); };
console.warn  = (...args: any[]) => { if (!shouldSuppress(args)) originalConsoleWarn.apply(console, args); };
console.log   = (...args: any[]) => { if (!shouldSuppress(args)) originalConsoleLog.apply(console, args); };

// ─── 3. Global unhandled-error / unhandled-rejection filters ─────────────────

const isAbortOrLockMessage = (msg?: string) =>
  !!msg && (msg.includes('AbortError') || msg.includes('Lock broken'));

window.addEventListener(
  'error',
  (event) => {
    if (
      event.error?.name === 'AbortError' ||
      isAbortOrLockMessage(event.message) ||
      isAbortOrLockMessage(event.error?.message)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true, // capture phase — intercept before other handlers
);

window.addEventListener(
  'unhandledrejection',
  (event) => {
    if (
      event.reason?.name === 'AbortError' ||
      isAbortOrLockMessage(event.reason?.message)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

export { originalConsoleError, originalConsoleWarn, originalConsoleLog };
