/** Parse deep-link paths under the scoring app base (e.g. /app/match/123). */

export function parseMatchIdFromPath(pathname: string, basePath = "/app"): string | null {
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const prefix = `${base}/match/`;
  if (!pathname.startsWith(prefix)) return null;
  const id = pathname.slice(prefix.length).split("/")[0]?.trim();
  return id || null;
}

export function buildPublicMatchUrl(matchId: string | number, origin?: string): string {
  const base = import.meta.env.BASE_URL ?? "/app/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const path = `${normalized}match/${matchId}`.replace(/\/+/g, "/");
  const host = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://vscor.in");
  return `${host}${path.startsWith("/") ? path : `/${path}`}`;
}
