/**
 * Tipo de cambio desde la API SIE de Banxico (requiere un token gratuito):
 * https://www.banxico.org.mx/SieAPIRest/service/v1/
 *
 * Se consulta el dato "oportuno" (el más reciente publicado) de cada serie.
 */

export const BANXICO_SERIES = {
  /** Tipo de cambio FIX, pesos por dólar. */
  USD: "SF43718",
  /** Pesos por euro. */
  EUR: "SF46410",
} as const;

export type Currency = keyof typeof BANXICO_SERIES;

export type ExchangeRateRow = {
  currency: Currency;
  mxnPerUnit: string;
  /** Fecha del dato en formato ISO (AAAA-MM-DD). */
  asOf: string;
};

type BanxicoResponse = {
  bmx: { series: { idSerie: string; datos?: { fecha: string; dato: string }[] }[] };
};

export function banxicoUrl(): string {
  const ids = Object.values(BANXICO_SERIES).join(",");
  return `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${ids}/datos/oportuno`;
}

/** Extrae el último dato de cada serie; omite las que no tienen dato publicado ("N/E"). */
export function parseBanxico(response: BanxicoResponse): ExchangeRateRow[] {
  const rows: ExchangeRateRow[] = [];
  for (const [currency, id] of Object.entries(BANXICO_SERIES) as [Currency, string][]) {
    const serie = response.bmx.series.find((s) => s.idSerie === id);
    const dato = serie?.datos?.at(-1);
    if (!dato) continue;

    const value = dato.dato.replace(/,/g, "");
    const date = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dato.fecha);
    if (!/^\d+(\.\d+)?$/.test(value) || Number(value) <= 0 || !date) continue;

    rows.push({ currency, mxnPerUnit: value, asOf: `${date[3]}-${date[2]}-${date[1]}` });
  }
  return rows;
}
