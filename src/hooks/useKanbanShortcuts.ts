import { useEffect } from "react";

interface Options {
  onFocusSearch?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKanbanShortcuts({ onFocusSearch, onEscape, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        onFocusSearch?.();
      }
      if (e.key === "Escape") {
        onEscape?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFocusSearch, onEscape, enabled]);
}
