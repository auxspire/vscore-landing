import { useState } from "react"
import { Link, useLocation, useSearch } from "wouter"
import { cn } from "@/lib/utils"
import { publicAsset } from "@/lib/assets"
import { homeTabFromSearch, type HomeTab } from "@/hooks/useHomeTab"
import { Menu, X, Swords, BarChart3, Calendar } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  homeTab?: HomeTab
  matchPrefix?: string
}

export function Navbar() {
  const [location] = useLocation()
  const search = useSearch()
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeHomeTab = location === "/" ? homeTabFromSearch(search) : null

  const navLinks: NavItem[] = [
    {
      href: "/",
      label: "Predictor",
      icon: <Swords className="w-3.5 h-3.5" />,
      homeTab: "predictor",
      matchPrefix: "/matchup",
    },
    {
      href: "/?tab=path",
      label: "Path to Final",
      icon: (
        <img
          src={publicAsset("wc26-sticker-path.png")}
          alt=""
          className="h-4 w-4 object-contain"
          width={16}
          height={16}
        />
      ),
      homeTab: "path",
      matchPrefix: "/bracket",
    },
    {
      href: "/?tab=fixtures",
      label: "Fixtures",
      icon: <Calendar className="w-3.5 h-3.5" />,
      homeTab: "fixtures",
    },
    {
      href: "/rankings",
      label: "Rankings",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
  ]

  function isActive(item: NavItem): boolean {
    if (item.matchPrefix && location.startsWith(item.matchPrefix)) return true
    if (item.homeTab != null) {
      if (location === "/" || location.startsWith("/?")) {
        return activeHomeTab === item.homeTab
      }
    }
    return location === item.href || location.startsWith(`${item.href}?`)
  }

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

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                isActive(item)
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
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
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors",
                isActive(item)
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
