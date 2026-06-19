import { useState } from "react";
import { cn, getFlagEmoji, getFlagImageUrl } from "@/lib/utils";

interface TeamFlagProps {
  flagCode?: string;
  flagUrl?: string | null;
  className?: string;
  /** Rendered width in CSS pixels */
  size?: number;
}

/** Cross-platform flag: external URL or PNG on desktop, emoji fallback. */
export function TeamFlag({ flagCode = "", flagUrl, className, size = 24 }: TeamFlagProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const height = Math.max(12, Math.round(size * 0.75));
  const retinaWidth = Math.max(40, size * 2);

  const cdnUrl = flagCode && !imgFailed ? getFlagImageUrl(flagCode, retinaWidth) : null;
  const src = !imgFailed && flagUrl ? flagUrl : cdnUrl;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={height}
        className={cn("inline-block shrink-0 rounded-sm object-cover", className)}
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
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
