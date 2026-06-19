import "./FAQ.css";

export interface FAQItem {
  question: string;
  /** Plain-text answer. Kept text-only so it can be reused verbatim in the
   * FAQPage JSON-LD without HTML stripping. */
  answer: string;
}

export interface FAQProps {
  items: FAQItem[];
}

/**
 * Accessible FAQ list (native <details> — no JS) that also emits a
 * schema.org `FAQPage` JSON-LD block for SEO/GEO. One per page.
 */
export function FAQ({ items }: FAQProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };

  return (
    <div className="faq">
      {items.map((it) => (
        <details key={it.question} className="faq-item">
          <summary className="faq-question">{it.question}</summary>
          <p className="faq-answer">{it.answer}</p>
        </details>
      ))}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
