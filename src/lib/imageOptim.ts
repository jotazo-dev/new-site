/**
 * Image URL optimization helpers.
 * - Adds width/quality/format hints to known providers (Unsplash) so we don't
 *   download oversized originals on small screens.
 * - For other providers (Supabase storage, TMDB, randomuser) the URL is
 *   returned unchanged.
 */
export function optimizeImageUrl(
  url: string | undefined | null,
  opts: { width?: number; quality?: number } = {}
): string {
  if (!url) return "";
  const { width = 800, quality = 75 } = opts;

  try {
    if (url.includes("images.unsplash.com")) {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    }
  } catch {
    /* no-op */
  }
  return url;
}

/**
 * Build a TMDB poster srcset (mobile w185/w342, desktop w500).
 * Input must already be a TMDB URL with a known size segment (w342, w500…).
 */
export function tmdbSrcSet(url: string): { src: string; srcSet: string; sizes: string } {
  const match = url.match(/\/t\/p\/(w\d+|original)\//);
  if (!match) return { src: url, srcSet: "", sizes: "" };
  const small = url.replace(match[0], "/t/p/w185/");
  const medium = url.replace(match[0], "/t/p/w342/");
  const large = url.replace(match[0], "/t/p/w500/");
  return {
    src: medium,
    srcSet: `${small} 185w, ${medium} 342w, ${large} 500w`,
    sizes: "(max-width: 640px) 140px, (max-width: 1024px) 160px, 170px",
  };
}

/**
 * Convert a public Supabase Storage URL into the on-the-fly image renderer URL,
 * requesting a specific format (avif/webp) and optional width/quality.
 *
 * Public object: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * Render URL:    https://<ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?format=avif&width=1920&quality=70
 *
 * Returns null when the URL is not a Supabase public-object URL.
 */
export function supabaseImageUrl(
  url: string | undefined | null,
  opts: { format?: "avif" | "webp" | "jpeg"; width?: number; quality?: number } = {}
): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const base = url.slice(0, idx) + "/storage/v1/render/image/public/";
  const [pathAndQuery] = url.slice(idx).split("#");
  const rest = pathAndQuery.slice(marker.length);
  const [path, existingQuery] = rest.split("?");
  const params = new URLSearchParams(existingQuery || "");
  if (opts.format) params.set("format", opts.format);
  if (opts.width) params.set("width", String(opts.width));
  if (opts.quality) params.set("quality", String(opts.quality));
  const qs = params.toString();
  return base + path + (qs ? `?${qs}` : "");
}

