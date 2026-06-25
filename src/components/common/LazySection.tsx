import * as React from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /** Min-height to reserve while not mounted (avoids CLS). */
  minHeight?: string;
  /** Root margin for IntersectionObserver. Defaults to "800px" (preload before in view). */
  rootMargin?: string;
  /** If true, mount immediately (skip lazy). */
  eager?: boolean;
  /** Optional chunk prefetch fired on idle to warm the JS cache before the user reaches it. */
  prefetch?: () => Promise<unknown>;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Defers mounting children until they are about to enter the viewport.
 * Reduces initial JS execution and component setup cost on heavy pages.
 */
export function LazySection({
  children,
  minHeight = "200px",
  rootMargin = "800px",
  eager = false,
  prefetch,
}: LazySectionProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(eager);

  // Warm chunk on idle so when the observer fires, JS is already cached.
  React.useEffect(() => {
    if (!prefetch || visible) return;
    const w = window as IdleWindow;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(() => {
        prefetch().catch(() => {});
      }, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(() => {
        prefetch().catch(() => {});
      }, 1500);
    }
    return () => {
      if (idleId !== null && typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [prefetch, visible]);

  React.useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={!visible ? { minHeight } : undefined}>
      {visible ? (
        <React.Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
          {children}
        </React.Suspense>
      ) : null}
    </div>
  );
}
