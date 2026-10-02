/**
 * Precios de Card Kingdom desde MTGJSON (AllPricesToday) convertidos a filas
 * de price_reference.
 *
 * MTGJSON identifica cada carta con su propio uuid; el cruce con Scryfall sale
 * de csv/cardIdentifiers.csv (columnas uuid y scryfallId). Las cartas de dos
 * caras tienen un uuid por cara con el mismo scryfallId.
 */
import type { CardFinish, PriceRow } from "./scryfall";

type PricesByFinish = Partial<Record<string, Record<string, number>>>;

/** Precios de un uuid en AllPricesToday: fuente → lista de venta o compra → acabado → fecha → precio. */
type PriceFormats = {
  paper?: Record<string, { currency?: string; retail?: PricesByFinish; buylist?: PricesByFinish } | undefined>;
};

export type AllPricesToday = {
  meta: { date: string };
  data: Record<string, PriceFormats>;
};

const FINISHES: Record<string, CardFinish> = { normal: "nonfoil", foil: "foil", etched: "etched" };

/** uuid de MTGJSON → id de Scryfall, a partir de las filas de cardIdentifiers.csv (con encabezado). */
export function scryfallIdsByUuid(rows: string[][]): Map<string, string> {
  const [header = [], ...data] = rows;
  const uuidCol = header.indexOf("uuid");
  const scryfallCol = header.indexOf("scryfallId");
  if (uuidCol === -1 || scryfallCol === -1) throw new Error("cardIdentifiers.csv no trae las columnas uuid y scryfallId");

  const ids = new Map<string, string>();
  for (const row of data) {
    const uuid = row[uuidCol];
    const scryfallId = row[scryfallCol];
    if (uuid && scryfallId) ids.set(uuid, scryfallId);
  }
  return ids;
}

/**
 * Precios de venta (retail) de Card Kingdom por impresión de Scryfall y acabado.
 * Ignora los precios de compra (buylist), los uuid sin id de Scryfall y los que
 * no están en `known` (impresiones que no guardamos). De cada acabado toma el
 * precio de la fecha más reciente.
 */
export function toCardKingdomPrices(
  prices: AllPricesToday,
  scryfallIds: ReadonlyMap<string, string>,
  known: ReadonlySet<string>,
): PriceRow[] {
  const rows = new Map<string, PriceRow>();
  for (const [uuid, formats] of Object.entries(prices.data)) {
    const ck = formats.paper?.cardkingdom;
    const printingId = scryfallIds.get(uuid);
    if (!ck?.retail || ck.currency !== "USD" || !printingId || !known.has(printingId)) continue;

    for (const [field, byDate] of Object.entries(ck.retail)) {
      const finish = FINISHES[field];
      const latest = byDate && Object.keys(byDate).sort().at(-1);
      if (!finish || !latest) continue;
      const value = byDate[latest];
      if (!Number.isFinite(value) || value < 0) continue;

      const key = `${printingId}:${finish}`;
      if (rows.has(key)) continue; // la otra cara de la misma carta
      rows.set(key, { printingId, source: "ck", finish, currency: "USD", amount: value.toFixed(2), asOf: latest });
    }
  }
  return [...rows.values()];
}
