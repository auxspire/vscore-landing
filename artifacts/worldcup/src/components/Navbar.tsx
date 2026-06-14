import { useState } from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { publicAsset } from "@/lib/assets"
import { Menu, X, Swords, BarChart3 } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: "/rankings", label: "Rankings", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { href: "/matchup", label: "Matchup", icon: <Swords className="w-3.5 h-3.5" /> },
    {
      href: "/bracket",
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
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-[4.25rem] gap-3">
          <a
            href="/"
            className="flex items-center shrink-0 rounded-lg px-2 py-1.5 -ml-2 hover:bg-secondary/60 transition-colors"
            title="Back to VScor home"
          >
            <img
              src={publicAsset("vscor-logo-wc.png")}
              alt="VScor"
              className="h-11 md:h-12 w-auto max-w-[220px] object-contain"
              width={220}
              height={52}
            />
          </a>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                  location === href || (href === "/matchup" && location.startsWith("/matchup"))
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors",
                location === href || (href === "/matchup" && location.startsWith("/matchup"))
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {icon}
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
