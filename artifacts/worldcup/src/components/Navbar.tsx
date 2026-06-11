import { useState } from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { GitBranch, Trophy, Menu, X, Swords, BarChart3 } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isInApp = location === "/bracket" || location.startsWith("/matchup") || location === "/rankings"

  const navLinks = [
    { href: "/rankings", label: "Rankings", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { href: "/matchup", label: "Matchup", icon: <Swords className="w-3.5 h-3.5" /> },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Left: VScor back-link + Brand */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex items-center gap-1"
            >
              ← VScor
            </a>
            <span className="hidden sm:block text-border/60 text-sm select-none">|</span>
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm uppercase tracking-widest font-mono hidden sm:block">
                WC 2026
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                  location === href || (href === "/matchup" && location.startsWith("/matchup"))
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {icon}
                {label}
              </Link>
            ))}

            {/* World Cup Simulator CTA */}
            <Link
              href="/bracket"
              className={cn(
                "flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border",
                isInApp && location === "/bracket"
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_-4px_hsl(var(--primary)/0.8)]"
                  : "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
              )}
            >
              <GitBranch className="w-3.5 h-3.5" />
              World Cup Simulator
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
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
          <Link
            href="/bracket"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border mt-2",
              location === "/bracket"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/60"
            )}
          >
            <GitBranch className="w-4 h-4" />
            World Cup Simulator
          </Link>
        </div>
      )}
    </nav>
  )
}
