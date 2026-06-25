/**
 * Convert a BRL display string (e.g. "75,90", "1.250,00", "R$ 75,90")
 * into integer cents (e.g. 7590, 125000). Empty/invalid → 0.
 */
export function reaisToCents(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  const str = String(input);
  // Remove anything that is not digit, comma, dot or minus, then drop thousand separators (.) and use . as decimal
  const cleaned = str.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!isFinite(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Convert integer cents (e.g. 7590) into an editable BRL string
 * using comma as decimal separator (e.g. "75,90"). 0 → "".
 */
export function centsToReais(cents: number | string | null | undefined): string {
  if (cents === null || cents === undefined || cents === "") return "";
  const n = typeof cents === "string" ? Number(cents) : cents;
  if (!isFinite(n) || n === 0) return "";
  return (n / 100).toFixed(2).replace(".", ",");
}
