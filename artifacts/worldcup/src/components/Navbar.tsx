import { useState } from "react"
import { Link, useLocation, useSearch } from "wouter"
import { cn } from "@/lib/utils"
import { publicAsset } from "@/lib/assets"
import { Menu, X, BarChart3 } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const search = useSearch()
  const [mobileOpen, setMobileOpen] = useState(false)

  const qs = search.startsWith("?") ? search.slice(1) : search
  const params = new URLSearchParams(qs)
  const isRankings =
    location.startsWith("/rankings") ||
    (location === "/" && params.get("tab") === "path" && params.get("section") === "rankings")

  const rankingsHref = "/?tab=path&section=rankings"

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 py-[1.2rem] px-[5%]">
        <Link href="/" className="logo flex items-center shrink-0" title="World Cup hub">
          <img
            src={publicAsset("vscor-logo-wc.png")}
            alt="VScor"
            className="h-[52px] w-auto block object-contain bg-transparent"
            width={200}
            height={52}
          />
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href={rankingsHref}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
              isRankings
                ? "text-primary bg-primary/10 border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Rankings
          </Link>
          <a
            href="https://vscor.in"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-2"
          >
            vscor.in
          </a>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-[5%] py-3 space-y-1">
          <Link
            href={rankingsHref}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider",
              isRankings ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Rankings
          </Link>
          <a
            href="https://vscor.in"
            className="block px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-muted-foreground"
          >
            Back to vscor.in
          </a>
        </div>
      )}
    </nav>
  )
}
