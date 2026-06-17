import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatShareClipboard, type SharePayload } from "@/lib/share-messages";

interface SharePredictionButtonProps {
  payload: SharePayload;
}

export function SharePredictionButton({ payload }: SharePredictionButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareText = formatShareClipboard(payload);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        // Full message in text so the prediction link stays first (some targets ignore url)
        await navigator.share({ title: payload.headline, text: shareText });
        return;
      } catch {
        /* user cancelled */
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Prediction link and details are ready to share.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {"share" in navigator && (
        <Button type="button" variant="outline" size="sm" onClick={handleNativeShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      )}
      <Button type="button" variant="outline" size="sm" onClick={handleWhatsApp} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        Copy
      </Button>
    </div>
  );
}
