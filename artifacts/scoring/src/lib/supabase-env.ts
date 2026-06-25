/** Scoring app Supabase config — from Vite env (same project as worldcup). */

const trimSlash = (value: string) => value.replace(/\/$/, "");

function readEnv(name: string): string | undefined {
  const raw = import.meta.env[name as keyof ImportMetaEnv] as string | undefined;
  return raw?.trim() || undefined;
}

export function getMissingSupabaseEnvVars(): string[] {
  const missing: string[] = [];
  if (!readEnv("VITE_SUPABASE_URL")) missing.push("VITE_SUPABASE_URL");
  if (!readEnv("VITE_SUPABASE_ANON_KEY")) missing.push("VITE_SUPABASE_ANON_KEY");
  return missing;
}

export function isSupabaseConfigured(): boolean {
  return getMissingSupabaseEnvVars().length === 0;
}

export const supabaseUrl = readEnv("VITE_SUPABASE_URL")
  ? trimSlash(readEnv("VITE_SUPABASE_URL")!)
  : "";

export const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY") ?? "";

export const scoringFunctionSlug =
  readEnv("VITE_SCORING_FUNCTION_SLUG") ?? "make-server-845a157a";

export const scoringFunctionsUrl = isSupabaseConfigured()
  ? `${supabaseUrl}/functions/v1/${scoringFunctionSlug}`
  : "";

/** App base for OAuth redirects (e.g. https://vscor.in/app/) */
export function appBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/app/";
  if (typeof window !== "undefined") {
    return `${window.location.origin}${base.endsWith("/") ? base : `${base}/`}`;
  }
  return base;
}
