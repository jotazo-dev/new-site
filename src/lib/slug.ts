/**
 * Normaliza um nome de cidade para slug URL-safe.
 * Ex.: "Pariquera-Açu" → "pariquera-acu"; "Apiaí" → "apiai".
 */
export function citySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
