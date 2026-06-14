import { useState } from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { publicAsset } from "@/lib/assets"
import { Menu, X, Swords, BarChart3, ArrowRight, GitBranch } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isInApp =
    location === "/bracket" || location.startsWith("/matchup") || location === "/rankings"

  const navLinks = [
    { href: "/rankings", label: "Rankings", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { href: "/matchup", label: "Matchup", icon: <Swords className="w-3.5 h-3.5" /> },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14 gap-3">

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a
              href="/"
              className="flex items-center gap-2 shrink-0 rounded-lg px-2 py-1 -ml-2 hover:bg-secondary/60 transition-colors"
              title="Back to VScor home"
            >
              <img
                src={publicAsset("vscor-logo.png")}
                alt="VScor"
                className="h-7 w-auto"
                width={120}
                height={28}
              />
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                Home
              </span>
            </a>
            <span className="text-border/60 text-sm select-none hidden sm:block">|</span>
            <Link
              href="/"
              className="flex items-center gap-2 min-w-0 text-foreground hover:text-primary transition-colors"
            >
              <img
                src={publicAsset("wc26-sticker-matchup.png")}
                alt="WC26 Predictor"
                className="h-8 w-8 shrink-0 rounded-md object-contain"
                width={32}
                height={32}
              />
              <span className="font-bold text-sm uppercase tracking-widest font-mono truncate hidden sm:block">
                WC26 Predictor
              </span>
            </Link>
          </div>

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

            <Link
              href="/bracket"
              className={cn(
                "flex items-center gap-2 ml-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border",
                isInApp && location === "/bracket"
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_16px_-4px_hsl(var(--primary)/0.8)]"
                  : "bg-black border-primary/50 text-primary hover:border-primary hover:shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]"
              )}
            >
              <img
                src={publicAsset("wc26-sticker-path.png")}
                alt=""
                className="h-6 w-6 object-contain"
                width={24}
                height={24}
              />
              Path to Final
            </Link>
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
          <Link
            href="/bracket"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border mt-2",
              location === "/bracket"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-black border-primary/50 text-primary hover:border-primary"
            )}
          >
            <img
              src={publicAsset("wc26-sticker-path.png")}
              alt=""
              className="h-5 w-5 object-contain"
              width={20}
              height={20}
            />
            Path to Final
          </Link>
        </div>
      )}
    </nav>
  )
}

export function HeroActionButtons({
  onMatchupClick,
  className,
}: {
  onMatchupClick?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 w-full max-w-md", className)}>
      <button
        type="button"
        onClick={onMatchupClick}
        className={cn(
          "group flex items-center gap-3 w-full rounded-full border border-primary/35 bg-black",
          "px-4 py-3 text-left transition-all hover:border-primary/60 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.45)]"
        )}
      >
        <img
          src={publicAsset("wc26-sticker-matchup.png")}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
          width={40}
          height={40}
        />
        <span className="w-px h-8 bg-primary/25 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-primary text-sm sm:text-base">Matchup Predictor</span>
          <span className="block text-xs text-muted-foreground truncate">
            Predict World Cup matchups & probabilities
          </span>
        </span>
        <ArrowRight className="w-5 h-5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>

      <Link href="/bracket" className="block w-full">
        <span
          className={cn(
            "group flex items-center gap-3 w-full rounded-full",
            "bg-primary text-primary-foreground px-4 py-3 font-bold text-sm sm:text-base",
            "transition-all hover:brightness-110 hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)]"
          )}
        >
          <img
            src={publicAsset("wc26-sticker-path.png")}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
            width={40}
            height={40}
          />
          <span className="flex-1">Path to Final</span>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>
    </div>
  )
}
