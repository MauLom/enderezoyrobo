import { type Condition, parseCondition } from "@/lib/cards/condition";
import { normalizeHeader, parseCsv } from "@/lib/import/csv";
import { parseMxnCents } from "@/lib/pricing/mxn";

/**
 * Plantilla de inventario para tiendas:
 *
 *   carta,set,numero,condicion,idioma,foil,cantidad,precio
 *   Sol Ring,C21,263,NM,Inglés,No,3,45
 *
 * Solo carta, cantidad y precio son obligatorias. Si falta la columna de
 * condición se asume NM y se avisa; si falta idioma se asume inglés.
 */

export type InventoryRow = {
  rowNumber: number;
  name: string;
  setCode: string | null;
  collectorNumber: string | null;
  condition: Condition;
  /** Código de idioma de Scryfall: en, es, ja, ... */
  language: string;
  foil: boolean;
  quantity: number;
  /** Precio unitario en centavos de MXN, para no arrastrar errores de punto flotante. */
  priceMxnCents: number;
};

export type InventoryIssue = {
  /** 1 es el encabezado; null si el problema es del archivo completo. */
  rowNumber: number | null;
  message: string;
};

export type InventoryResult = {
  rows: InventoryRow[];
  errors: InventoryIssue[];
  warnings: InventoryIssue[];
};

type Field =
  | "name"
  | "setCode"
  | "collectorNumber"
  | "condition"
  | "language"
  | "foil"
  | "quantity"
  | "price";

const HEADER_ALIASES: Record<Field, string[]> = {
  name: ["carta", "nombre", "name", "card", "card name"],
  setCode: ["set", "edicion", "set code", "expansion"],
  collectorNumber: ["numero", "no", "num", "collector number", "number", "numero de coleccion"],
  condition: ["condicion", "estado", "condition"],
  language: ["idioma", "language", "lang"],
  foil: ["foil"],
  quantity: ["cantidad", "qty", "quantity", "count", "existencias"],
  price: ["precio", "precio mxn", "price", "precio unitario"],
};

const REQUIRED: Field[] = ["name", "quantity", "price"];

const HEADER_LABELS: Record<Field, string> = {
  name: "carta",
  setCode: "set",
  collectorNumber: "numero",
  condition: "condicion",
  language: "idioma",
  foil: "foil",
  quantity: "cantidad",
  price: "precio",
};

const LANGUAGES: Record<string, string> = {
  en: "en", ingles: "en", english: "en",
  es: "es", sp: "es", espanol: "es", spanish: "es",
  fr: "fr", frances: "fr", french: "fr",
  de: "de", aleman: "de", german: "de",
  it: "it", italiano: "it", italian: "it",
  pt: "pt", portugues: "pt", portuguese: "pt",
  ja: "ja", jp: "ja", japones: "ja", japanese: "ja",
  ko: "ko", kr: "ko", coreano: "ko", korean: "ko",
  ru: "ru", ruso: "ru", russian: "ru",
  zhs: "zhs", "chino simplificado": "zhs", "simplified chinese": "zhs",
  zht: "zht", "chino tradicional": "zht", "traditional chinese": "zht",
  ph: "ph", phyrexian: "ph", pirexiano: "ph",
};

const TRUE_VALUES = new Set(["si", "yes", "y", "true", "1", "x", "foil", "etched"]);
const FALSE_VALUES = new Set(["", "no", "n", "false", "0", "normal", "nonfoil"]);

export function parseStoreInventory(csvText: string): InventoryResult {
  const result: InventoryResult = { rows: [], errors: [], warnings: [] };
  const [header, ...body] = parseCsv(csvText);
  if (!header) {
    result.errors.push({ rowNumber: null, message: "El archivo está vacío" });
    return result;
  }

  const columns = mapColumns(header);
  const missing = REQUIRED.filter((field) => columns[field] === undefined);
  if (missing.length > 0) {
    result.errors.push({
      rowNumber: 1,
      message: `Faltan columnas obligatorias: ${missing.map((f) => HEADER_LABELS[f]).join(", ")}`,
    });
    return result;
  }
  if (columns.condition === undefined) {
    result.warnings.push({
      rowNumber: 1,
      message: "No hay columna de condición; se asume NM para todo el inventario",
    });
  }

  body.forEach((cells, index) => {
    const rowNumber = index + 2;
    const get = (field: Field) => {
      const column = columns[field];
      return column === undefined ? "" : (cells[column] ?? "").trim();
    };
    const fail = (message: string) => result.errors.push({ rowNumber, message });

    const name = get("name");
    if (name === "") return fail("Falta el nombre de la carta");

    const quantity = parseQuantity(get("quantity"));
    if (quantity === null) return fail(`Cantidad inválida: "${get("quantity")}"`);

    const priceMxnCents = parseMxnCents(get("price"));
    if (priceMxnCents === null) return fail(`Precio inválido: "${get("price")}"`);

    let condition: Condition = "NM";
    if (columns.condition !== undefined) {
      const parsed = parseCondition(get("condition"));
      if (parsed === null) return fail(`Condición no reconocida: "${get("condition")}"`);
      condition = parsed;
    }

    const rawLanguage = get("language");
    const language = rawLanguage === "" ? "en" : LANGUAGES[normalizeHeader(rawLanguage)];
    if (!language) return fail(`Idioma no reconocido: "${rawLanguage}"`);

    const rawFoil = normalizeHeader(get("foil"));
    if (!TRUE_VALUES.has(rawFoil) && !FALSE_VALUES.has(rawFoil)) {
      return fail(`Valor de foil no reconocido: "${get("foil")}" (usa Sí o No)`);
    }

    result.rows.push({
      rowNumber,
      name,
      setCode: get("setCode").toLowerCase() || null,
      collectorNumber: get("collectorNumber") || null,
      condition,
      language,
      foil: TRUE_VALUES.has(rawFoil),
      quantity,
      priceMxnCents,
    });
  });

  return result;
}

function mapColumns(header: string[]): Partial<Record<Field, number>> {
  const columns: Partial<Record<Field, number>> = {};
  header.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [Field, string[]][]) {
      if (columns[field] === undefined && aliases.includes(normalized)) {
        columns[field] = index;
      }
    }
  });
  return columns;
}

function parseQuantity(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

