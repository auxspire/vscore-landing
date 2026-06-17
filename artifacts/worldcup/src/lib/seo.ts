import { useEffect } from "react"

export const SITE_ORIGIN = "https://vscor.in"
export const WORLDCUP_BASE = `${SITE_ORIGIN}/worldcup`

export const DEFAULT_KEYWORDS =
  "VScor, world cup predictor, world cup 2026 predictor, match probability predictor, FIFA World Cup simulator, bracket predictor, Monte Carlo football, World Cup odds, probability calculator"

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let el = document.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement("link")
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export interface PageSeoOptions {
  title: string
  description: string
  /** Path after /worldcup, e.g. `/bracket` or `/matchup?teamA=bra&teamB=arg` */
  path?: string
  keywords?: string
  noindex?: boolean
}

export function applyPageSeo({
  title,
  description,
  path = "/",
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
}: PageSeoOptions) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const canonical = `${WORLDCUP_BASE}${normalizedPath === "/" ? "/" : normalizedPath}`

  document.title = title
  upsertMeta("name", "description", description)
  upsertMeta("name", "keywords", keywords)
  upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow")
  upsertLink("canonical", canonical)

  upsertMeta("property", "og:title", title)
  upsertMeta("property", "og:description", description)
  upsertMeta("property", "og:url", canonical)
  upsertMeta("property", "og:type", "website")
  upsertMeta("property", "og:site_name", "VScor")

  upsertMeta("name", "twitter:title", title)
  upsertMeta("name", "twitter:description", description)
  upsertMeta("name", "twitter:card", "summary_large_image")
}

export function usePageSeo(options: PageSeoOptions) {
  useEffect(() => {
    applyPageSeo(options)
  }, [options.title, options.description, options.path, options.keywords, options.noindex])
}

export const PAGE_SEO = {
  home: {
    title: "VScor World Cup 2026 Hub | Predictor, Bracket & Fixtures",
    description:
      "Free VScor World Cup 2026 hub: Monte Carlo match predictions, path-to-final bracket explorer, live fixtures, results, and group standings for all 48 teams.",
    path: "/",
  },
  bracket: {
    title: "World Cup 2026 Bracket Predictor | Path to Final | VScor",
    description:
      "Explore every nation's path to the World Cup 2026 final with VScor's bracket predictor. Stage-by-stage probabilities, likely opponents, and Monte Carlo simulation results.",
    path: "/bracket",
  },
  rankings: {
    title: "World Cup 2026 Power Rankings & Win Probability | VScor",
    description:
      "VScor World Cup 2026 power rankings: all 48 teams ranked by championship win probability from 10,000 tournament simulations. Compare round-of-32, quarter-final, and final odds.",
    path: "/rankings",
  },
  fixtures: {
    title: "World Cup 2026 Fixtures, Results & Group Standings | VScor",
    description:
      "Live World Cup 2026 fixtures, match results, and group standings for all 48 teams. Updated schedule and tables synced from official tournament data.",
    path: "/?tab=fixtures",
  },
} as const

export function matchupSeo(teamA: string, teamB: string, probability?: number) {
  const pct = probability != null ? ` — ${(probability * 100).toFixed(1)}% meeting chance` : ""
  return {
    title: `${teamA} vs ${teamB} World Cup 2026 Match Probability${pct} | VScor`,
    description: `VScor predicts the probability of ${teamA} and ${teamB} meeting at each stage of World Cup 2026. Stage-by-stage matchup odds from 10,000 Monte Carlo simulations.`,
    path: `/matchup?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}`,
  }
}
