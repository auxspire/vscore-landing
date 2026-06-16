import { useState } from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { publicAsset } from "@/lib/assets"
import { Menu, X, Swords, BarChart3, Calendar } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: "/fixtures", label: "Fixtures", icon: <Calendar className="w-3.5 h-3.5" /> },
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
      <div className="flex items-center justify-between gap-3 py-[1.2rem] px-[5%]">
        <a
          href="/"
          className="logo flex items-center shrink-0"
          title="Back to VScor home"
        >
          <img
            src={publicAsset("vscor-logo-wc.png")}
            alt="VScor"
            className="h-[52px] w-auto block object-contain bg-transparent"
            width={200}
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

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-[5%] py-3 space-y-1">
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
