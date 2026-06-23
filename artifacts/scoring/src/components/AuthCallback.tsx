import { useEffect } from 'react';
import { supabase } from '../utils/database/supabaseClient';
import { crashLog } from '../utils/crashLogger';

/**
 * OAuth Callback Handler for Popup Flow
 * This component runs in the popup window after Google redirects back
 * It extracts the session and sends it to the parent window
 */
export function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        crashLog.info('🔐 [AuthCallback] Callback page loaded');
        crashLog.info('🔐 [AuthCallback] Current URL: ' + window.location.href);
        crashLog.info('🔐 [AuthCallback] Hash: ' + window.location.hash);
        
        // Check if this is a popup window
        const isPopup = window.opener && window.opener !== window;
        crashLog.info('🔐 [AuthCallback] Is popup: ' + isPopup);
        
        if (!isPopup) {
          crashLog.info('🔐 [AuthCallback] Not a popup - handling as regular redirect');
          // If not a popup, just let the app handle it normally
          return;
        }
        
        // Get the session from the URL hash
        crashLog.info('🔐 [AuthCallback] Getting session from URL...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          crashLog.error('❌ [AuthCallback] Error getting session:', error);
          // Notify parent of error
          if (window.opener) {
            window.opener.postMessage(
              { type: 'AUTH_ERROR', error: error.message },
              window.location.origin
            );
          }
          setTimeout(() => window.close(), 1000);
          return;
        }
        
        if (data.session) {
          crashLog.info('✅ [AuthCallback] Session found!');
          crashLog.info('✅ [AuthCallback] User: ' + data.session.user.email);
          
          // Send session to parent window
          if (window.opener) {
            crashLog.info('🔐 [AuthCallback] Sending session to parent window...');
            window.opener.postMessage(
              { 
                type: 'AUTH_SUCCESS', 
                session: {
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  user: data.session.user,
                }
              },
              window.location.origin
            );
            
            crashLog.info('✅ [AuthCallback] Session sent, closing popup...');
            setTimeout(() => window.close(), 500);
          } else {
            crashLog.error('❌ [AuthCallback] No window.opener found');
          }
        } else {
          crashLog.error('❌ [AuthCallback] No session found');
          if (window.opener) {
            window.opener.postMessage(
              { type: 'AUTH_ERROR', error: 'No session found' },
              window.location.origin
            );
          }
          setTimeout(() => window.close(), 1000);
        }
      } catch (err: any) {
        crashLog.error('❌ [AuthCallback] Exception:', err);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'AUTH_ERROR', error: err.message },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 1000);
      }
    };
    
    handleCallback();
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-purple-600">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Completing sign in...</p>
        <p className="text-sm opacity-75 mt-2">This window will close automatically</p>
      </div>
    </div>
  );
}
