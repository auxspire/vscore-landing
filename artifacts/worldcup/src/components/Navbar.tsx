import { useState } from "react"
import { Link } from "wouter"
import { publicAsset } from "@/lib/assets"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
