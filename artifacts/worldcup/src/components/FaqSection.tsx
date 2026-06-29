import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  className?: string;
  id?: string;
}

export function FaqSection({ items, className, id = "faq" }: FaqSectionProps) {
  useEffect(() => {
    const scriptId = "faq-json-ld";
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
    return () => {
      el?.remove();
    };
  }, [items]);

  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <h2 className="text-lg font-bold mb-4 tracking-tight">Common questions</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.question} className="rounded-xl border border-border bg-card/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">{item.question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "How is the World Cup 2026 knockout bracket built?",
    answer:
      "VScor uses the official FIFA 2026 Round of 32 draw matrix. Team slots are filled from live group standings — winners, runners-up, and the eight best third-place teams — then knockout results advance teams through each round.",
  },
  {
    question: "When does the bracket update?",
    answer:
      "The bracket refreshes as group standings and knockout match results are synced from the tournament API. Unfilled slots show projected positions (e.g. Winner Group A) until those places are decided.",
  },
  {
    question: "Where do fixtures and standings come from?",
    answer:
      "Match schedules, live scores, group tables, and scorers are synced from the open worldcup26.ir API into our database and refreshed throughout the tournament.",
  },
];
