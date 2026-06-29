import { useEffect } from "react"

export const SITE_ORIGIN = "https://vscor.in"
export const WORLDCUP_BASE = `${SITE_ORIGIN}/worldcup`

export const DEFAULT_KEYWORDS =
  "VScor, world cup 2026, FIFA World Cup bracket, knockout bracket, World Cup standings, World Cup fixtures, World Cup 2026 schedule"

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
    title: "VScor World Cup 2026 Hub | Knockout Bracket & Fixtures",
    description:
      "Live World Cup 2026 knockout bracket from group standings and results, plus fixtures, group tables, and scorers for all 48 teams.",
    path: "/",
  },
  bracket: {
    title: "World Cup 2026 Knockout Bracket | VScor",
    description:
      "Full FIFA World Cup 2026 knockout bracket — Round of 32 through the final — updated from live standings and match results.",
    path: "/bracket",
  },
  rankings: {
    title: "World Cup 2026 Knockout Bracket | VScor",
    description:
      "Full FIFA World Cup 2026 knockout bracket updated from live standings and results.",
    path: "/rankings",
  },
  fixtures: {
    title: "World Cup 2026 Fixtures, Results & Group Standings | VScor",
    description:
      "Live World Cup 2026 fixtures, match results, and group standings for all 48 teams. Updated schedule and tables synced from official tournament data.",
    path: "/?tab=fixtures",
  },
} as const

export function matchupSeo(teamA: string, teamB: string) {
  return {
    title: `${teamA} vs ${teamB} | World Cup 2026 | VScor`,
    description: `World Cup 2026 knockout bracket and fixtures on VScor.`,
    path: `/matchup?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}`,
  }
}
