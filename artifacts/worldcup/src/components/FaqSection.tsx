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
    question: "How does VScor calculate World Cup match probability?",
    answer:
      "VScor runs thousands of Monte Carlo simulations using Elo ratings for all 48 teams. It simulates the full group stage and knockout bracket to estimate where two teams are most likely to meet.",
  },
  {
    question: "How many simulations does VScor run?",
    answer:
      "Match, bracket, and rankings predictions use 10,000 Monte Carlo simulations by default — 15,000 when live tournament form is enabled for tighter blended estimates. The API supports up to 20,000 runs.",
  },
  {
    question: "Does VScor use live World Cup results?",
    answer:
      "Fixtures, standings, and scorers are synced from the open worldcup26.ir API into our database. Turn on “Factor in live tournament form” to adjust probabilities using that data.",
  },
];
