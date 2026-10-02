/** Conversión y formato de precios. Los montos en MXN viajan como centavos enteros. */

/**
 * Convierte un precio de referencia en moneda extranjera (texto decimal, como
 * viene de la base) a centavos de MXN con el tipo de cambio dado.
 */
export function toMxnCents(amount: string | number, mxnPerUnit: string | number): number {
  return Math.round(Number(amount) * Number(mxnPerUnit) * 100);
}

/** Acepta "45", "$1,234.50" y "1234.5 MXN" y devuelve centavos. Usa punto decimal, como en México. */
export function parseMxnCents(raw: string): number | null {
  const cleaned = raw.replace(/mxn|\$|\s/gi, "").replace(/,(?=\d{3}(\D|$))/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [pesos, cents = ""] = cleaned.split(".");
  return Number(pesos) * 100 + Number(cents.padEnd(2, "0"));
}

const MXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const MXN_ROUND = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

/** "$1,234.50"; sin decimales si son .00. */
export function formatMxn(cents: number): string {
  return cents % 100 === 0 ? MXN_ROUND.format(cents / 100) : MXN.format(cents / 100);
}

/** "US$1.95" o "€0.94", para cuando no hay tipo de cambio. */
export function formatForeign(amount: string | number, currency: "USD" | "EUR"): string {
  const value = Number(amount).toFixed(2);
  return currency === "USD" ? `US$${value}` : `€${value}`;
}

/** Días completos transcurridos desde `date`. */
export function daysSince(date: Date | string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000);
}

/** A partir de cuántos días el inventario se marca como viejo (aviso en ámbar). */
export const STALE_INVENTORY_DAYS = 30;

/** El inventario lleva más de STALE_INVENTORY_DAYS días sin actualizarse. */
export function isInventoryStale(updatedAt: Date | string, now: Date = new Date()): boolean {
  return daysSince(updatedAt, now) > STALE_INVENTORY_DAYS;
}

/** "hoy", "ayer", "hace 10 días". */
export function daysAgoLabel(date: Date | string, now: Date = new Date()): string {
  const days = daysSince(date, now);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}
