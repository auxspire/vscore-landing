import { cn } from "@/lib/utils"

interface ProbabilityBarProps {
  label: string
  probability: number
  description?: string
  colorClass?: string
  animate?: boolean
}

export function ProbabilityBar({ 
  label, 
  probability, 
  description, 
  colorClass = "bg-primary",
  animate = true
}: ProbabilityBarProps) {
  const percentage = (probability * 100).toFixed(1)
  
  return (
    <div className="space-y-2 w-full group">
      <div className="flex justify-between items-end text-sm">
        <span className="font-semibold text-foreground capitalize tracking-wide">{label.replace(/_/g, ' ')}</span>
        <span className="font-mono text-primary font-bold">{percentage}%</span>
      </div>
      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out", 
            colorClass,
            animate ? "opacity-100" : "opacity-0"
          )}
          style={{ width: `${Math.max(0.5, probability * 100)}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      )}
    </div>
  )
}
