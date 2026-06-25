import type * as React from "react";

/**
 * AnswerFirstParagraph — short, direct answer placed near the H1 for GEO
 * (Generative Engine Optimization). LLMs (ChatGPT, Perplexity, Gemini)
 * extract this as the canonical answer about the page topic.
 *
 * Uses the `.answer-first` class hook so the Speakable schema can target it.
 * Visually hidden via `sr-only` to avoid duplicating the visible hero copy,
 * but still present in the DOM for crawlers and screen readers.
 */
interface AnswerFirstParagraphProps {
  children: React.ReactNode;
  className?: string;
}

export function AnswerFirstParagraph({ children, className = "" }: AnswerFirstParagraphProps) {
  return (
    <p
      className={`answer-first sr-only ${className}`.trim()}
      data-geo="answer-first"
    >
      {children}
    </p>
  );
}
