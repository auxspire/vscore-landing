import "../suppressAbortErrors";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase-env";
import { crashLog } from "../crashLogger";

const WIN = window as Window & { __vscor_supabase_client__?: SupabaseClient };

let supabase: SupabaseClient;

if (WIN.__vscor_supabase_client__) {
  supabase = WIN.__vscor_supabase_client__;
  crashLog.info("🔧 [supabaseClient] Reusing existing Supabase singleton from window");
} else {
  crashLog.info("🔧 [supabaseClient] Creating new Supabase singleton...");
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  WIN.__vscor_supabase_client__ = supabase;
  crashLog.info("✅ [supabaseClient] Singleton created and stored on window");
}

export { supabase };

export const isOnline = (): boolean => navigator.onLine;

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }
  return user;
};

export const isAuthenticated = async (): Promise<boolean> => !!(await getCurrentUser());
