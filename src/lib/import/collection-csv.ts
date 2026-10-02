import { normalizeHeader, parseCsv } from "@/lib/import/csv";
import type { DecklistResult, LineError, ParsedLine } from "@/lib/import/decklist";

/**
 * CSV que exportan ManaBox y Moxfield, convertido a las mismas líneas que una
 * lista pegada como texto. Las columnas se buscan por nombre:
 *
 *   ManaBox:  Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,…
 *   Moxfield: Count,Tradelist Count,Name,Edition,Condition,Language,Foil,…,Collector Number,…
 *
 * Confirmado a mano con exports reales de ambas aplicaciones (#17).
 * Condición e idioma no se usan: en una want list son lo mínimo que se pide y
 * se ajustan después en cada carta.
 */

export type CsvFormat = "manabox" | "moxfield" | "csv";

export type CollectionCsvResult = DecklistResult & { format: CsvFormat };

type Field = "name" | "quantity" | "setCode" | "collectorNumber" | "foil" | "scryfallId";

const HEADER_ALIASES: Record<Field, string[]> = {
  name: ["name", "card name", "carta", "nombre"],
  quantity: ["quantity", "count", "qty", "cantidad"],
  setCode: ["set code", "edition", "set"],
  collectorNumber: ["collector number", "number", "numero"],
  foil: ["foil"],
  scryfallId: ["scryfall id"],
};

const MAX_QUANTITY = 999;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function columnsOf(header: string[]): Partial<Record<Field, number>> {
  const normalized = header.map(normalizeHeader);
  const columns: Partial<Record<Field, number>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [Field, string[]][]) {
    const index = normalized.findIndex((h) => aliases.includes(h));
    if (index >= 0) columns[field] = index;
  }
  return columns;
}

/** ¿El texto empieza con un encabezado de CSV con nombre y cantidad? Así se distingue de una lista en texto. */
export function looksLikeCollectionCsv(text: string): boolean {
  const firstLine = text.replace(/^﻿/, "").trimStart().split(/\r?\n/, 1)[0] ?? "";
  if (!firstLine.includes(",") && !firstLine.includes(";")) return false;
  const columns = columnsOf(parseCsv(firstLine)[0] ?? []);
  return columns.name !== undefined && columns.quantity !== undefined;
}

function detectFormat(header: string[]): CsvFormat {
  const normalized = new Set(header.map(normalizeHeader));
  if (normalized.has("manabox id")) return "manabox";
  if (normalized.has("tradelist count")) return "moxfield";
  return "csv";
}

/** Foil: ManaBox escribe "normal", "foil" o "etched"; Moxfield deja vacío, "foil" o "etched". */
function parseFoil(raw: string | undefined): boolean | null {
  const value = (raw ?? "").trim().toLowerCase();
  return value === "foil" || value === "etched" ? true : null;
}

export function parseCollectionCsv(text: string): CollectionCsvResult {
  const [header, ...rows] = parseCsv(text);
  const format = header ? detectFormat(header) : "csv";
  const columns = columnsOf(header ?? []);
  if (columns.name === undefined || columns.quantity === undefined) {
    return {
      format,
      lines: [],
      errors: [{ lineNumber: 1, raw: (header ?? []).join(","), message: "El CSV necesita columnas de nombre y cantidad" }],
    };
  }

  const lines: ParsedLine[] = [];
  const errors: LineError[] = [];
  const cell = (row: string[], field: Field) => {
    const index = columns[field];
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  rows.forEach((row, index) => {
    // El encabezado es la línea 1.
    const lineNumber = index + 2;
    const name = cell(row, "name");
    const setCode = cell(row, "setCode").toLowerCase() || null;
    const collectorNumber = cell(row, "collectorNumber") || null;
    const rawQuantity = cell(row, "quantity");
    const raw = [rawQuantity, name, setCode ? `(${setCode.toUpperCase()})` : "", collectorNumber ?? ""].filter(Boolean).join(" ");

    if (!name) {
      errors.push({ lineNumber, raw: row.join(","), message: "Falta el nombre de la carta" });
      return;
    }
    const quantity = Number(rawQuantity);
    if (!/^\d+$/.test(rawQuantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      errors.push({ lineNumber, raw, message: `Cantidad inválida: ${rawQuantity || "vacía"}` });
      return;
    }
    const scryfallId = cell(row, "scryfallId");

    lines.push({
      lineNumber,
      raw,
      quantity,
      name,
      setCode,
      collectorNumber,
      foil: parseFoil(cell(row, "foil")),
      scryfallId: UUID.test(scryfallId) ? scryfallId.toLowerCase() : null,
    });
  });

  return { format, lines, errors };
}
