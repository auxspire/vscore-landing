export function LoadingAnimation({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-6 select-none">
      <div className="flex flex-col items-center">
        {/* Outer div: vertical bounce */}
        <div style={{ animation: "ball-rise 0.85s ease-in-out infinite" }}>
          {/* Middle div: landing squish */}
          <div style={{ animation: "ball-squish 0.85s ease-in-out infinite" }}>
            {/* Inner span: continuous spin */}
            <span
              style={{ animation: "ball-spin 0.85s linear infinite" }}
              className="text-6xl leading-none inline-block"
            >
              ⚽
            </span>
          </div>
        </div>
        {/* Ground shadow */}
        <div
          style={{ animation: "ball-shadow 0.85s ease-in-out infinite" }}
          className="mt-1 w-12 h-2 rounded-full bg-foreground/20 blur-[2px]"
        />
      </div>

      {/* Trophy floats up and down with a primary-colour glow */}
      <div
        style={{
          animation: "trophy-float 1.7s ease-in-out infinite",
          animationDelay: "0.425s",
        }}
        className="text-4xl leading-none"
      >
        🏆
      </div>

      {/* Message + animated dots */}
      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground tracking-[0.25em] uppercase">
        <span>{message ?? "Simulating"}</span>
        <span className="inline-flex gap-0.5 ml-0.5">
          {(["0ms", "200ms", "400ms"] as const).map((d) => (
            <span
              key={d}
              style={{ animation: "pulse 1.2s ease-in-out infinite", animationDelay: d }}
              className="inline-block w-1 h-1 rounded-full bg-muted-foreground/60 mt-[1px]"
            />
          ))}
        </span>
      </div>
    </div>
  )
}
