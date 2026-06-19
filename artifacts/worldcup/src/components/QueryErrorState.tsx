import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorState({
  title = "Could not load data",
  message = "Something went wrong fetching results. Check your connection and try again.",
  onRetry,
}: QueryErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-destructive/30 rounded-2xl bg-destructive/5"
      role="alert"
    >
      <AlertCircle className="w-10 h-10 text-destructive/80 mb-4" aria-hidden />
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCcw className="w-4 h-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
