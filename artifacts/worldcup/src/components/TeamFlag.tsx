import { cn, getFlagEmoji, getFlagImageUrl } from "@/lib/utils";

interface TeamFlagProps {
  flagCode: string;
  className?: string;
  /** Rendered width in CSS pixels */
  size?: number;
}

/** Cross-platform flag: PNG on desktop (emoji fonts often missing), emoji fallback. */
export function TeamFlag({ flagCode, className, size = 24 }: TeamFlagProps) {
  const url = getFlagImageUrl(flagCode);
  const height = Math.max(12, Math.round(size * 0.75));

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={height}
        className={cn("inline-block shrink-0 rounded-sm object-cover", className)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      className={cn("inline-block shrink-0 leading-none", className)}
      style={{ fontSize: size }}
      aria-hidden
    >
      {getFlagEmoji(flagCode)}
    </span>
  );
}
