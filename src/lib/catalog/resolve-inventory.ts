import type { Condition } from "@/lib/cards/condition";
import type { InventoryIssue, InventoryRow } from "@/lib/import/store-inventory";
import { type CatalogPrinting, indexByName, newestEnglish, normalizeCardName, printingsOfCard } from "./resolve";

/**
 * Resuelve los renglones del CSV de inventario (ya parseados) contra el
 * catálogo. A diferencia de una want list, el inventario siempre es de una
 * impresión concreta:
 *
 * - Con set y número se usa esa impresión.
 * - Con set sin número, la de menor número de colección en ese set (y se avisa
 *   si hay varias).
 * - Sin set, o si el set y número no existen, la impresión más reciente en
 *   inglés, con aviso para que la tienda lo corrija si no es la suya.
 * - Las cartas de dos caras se encuentran también por la cara frontal.
 * - Los renglones con la misma impresión, condición, idioma y foil se suman;
 *   si traen precios distintos es un error.
 * - Cantidad 0 no se guarda.
 *
 * Con errores no se guarda nada: el inventario se reemplaza completo.
 */

/** Plan Vendedor básico (docs/02): hasta 100 cartas (copias) para vendedores sin tienda. */
export const SELLER_CARD_LIMIT = 100;

export type ResolvedInventoryItem = {
  /** Llave de la tabla inventory_item (sin vendedor). */
  key: string;
  printing: CatalogPrinting;
  condition: Condition;
  language: string;
  foil: boolean;
  quantity: number;
  priceMxnCents: number;
  rowNumbers: number[];
};

export type InventoryResolveResult = {
  items: ResolvedInventoryItem[];
  errors: InventoryIssue[];
  warnings: InventoryIssue[];
};

export function resolveInventory(rows: InventoryRow[], candidates: CatalogPrinting[]): InventoryResolveResult {
  const byName = indexByName(candidates);
  const items = new Map<string, ResolvedInventoryItem>();
  const errors: InventoryIssue[] = [];
  const warnings: InventoryIssue[] = [];

  for (const row of rows) {
    if (row.quantity === 0) {
      warnings.push({ rowNumber: row.rowNumber, message: `${row.name}: cantidad 0, no se guarda` });
      continue;
    }
    const matches = byName.get(normalizeCardName(row.name));
    if (!matches || matches.length === 0) {
      errors.push({ rowNumber: row.rowNumber, message: `No encontramos "${row.name}" en el catálogo` });
      continue;
    }

    const { printing, warning } = pickPrinting(row, printingsOfCard(matches));
    if (warning) warnings.push({ rowNumber: row.rowNumber, message: warning });

    const key = [printing.id, row.condition, row.language, row.foil].join("|");
    const existing = items.get(key);
    if (existing) {
      if (existing.priceMxnCents !== row.priceMxnCents) {
        errors.push({
          rowNumber: row.rowNumber,
          message: `${printing.name} repite la línea ${existing.rowNumbers[0]} (misma impresión, condición, idioma y foil) con otro precio`,
        });
        continue;
      }
      existing.quantity += row.quantity;
      existing.rowNumbers.push(row.rowNumber);
      continue;
    }
    items.set(key, {
      key,
      printing,
      condition: row.condition,
      language: row.language,
      foil: row.foil,
      quantity: row.quantity,
      priceMxnCents: row.priceMxnCents,
      rowNumbers: [row.rowNumber],
    });
  }

  return { items: [...items.values()], errors, warnings };
}

/** Error si un vendedor sin tienda pasa del límite de su plan; null si cabe. */
export function inventoryLimitError(kind: "player" | "seller" | "store", items: ResolvedInventoryItem[]): string | null {
  if (kind !== "seller") return null;
  const copies = items.reduce((sum, item) => sum + item.quantity, 0);
  if (copies <= SELLER_CARD_LIMIT) return null;
  return `Tu plan de vendedor permite hasta ${SELLER_CARD_LIMIT} cartas y el archivo trae ${copies}. Las tiendas no tienen límite.`;
}

function pickPrinting(row: InventoryRow, printings: CatalogPrinting[]): { printing: CatalogPrinting; warning?: string } {
  const fallback = newestEnglish(printings);
  const label = (p: CatalogPrinting) => `${p.setCode.toUpperCase()} ${p.collectorNumber}`;
  if (!row.setCode) {
    return { printing: fallback, warning: `${fallback.name}: sin set, se usó ${label(fallback)}` };
  }

  const inSet = printings
    .filter((p) => p.setCode === row.setCode)
    .sort((a, b) => a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true }));
  const wanted = [row.setCode.toUpperCase(), row.collectorNumber].filter(Boolean).join(" ");

  if (row.collectorNumber) {
    const exact = inSet.find((p) => p.collectorNumber === row.collectorNumber);
    if (exact) return { printing: exact };
  } else if (inSet.length > 0) {
    const [first] = inSet;
    return inSet.length === 1
      ? { printing: first }
      : { printing: first, warning: `${first.name}: hay ${inSet.length} impresiones en ${wanted}, se usó ${label(first)}` };
  }
  return { printing: fallback, warning: `${fallback.name}: no encontramos ${wanted}, se usó ${label(fallback)}` };
}
