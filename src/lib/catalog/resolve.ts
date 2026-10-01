import type { ParsedLine } from "@/lib/import/decklist";

/**
 * Resuelve las líneas de una lista (ya parseadas) contra impresiones del
 * catálogo buscadas por nombre. No consulta nada: recibe los candidatos.
 *
 * - Con set y número, se pide esa impresión exacta si existe; si no existe, se
 *   acepta cualquier impresión de la carta y se avisa.
 * - Sin set, se acepta cualquier impresión del mismo oracle id.
 * - Si varias cartas distintas se llaman igual (p. ej., una carta y su ficha),
 *   gana la que tiene más impresiones.
 * - Las líneas repetidas de la misma carta se suman.
 */

export type CatalogPrinting = {
  id: string;
  oracleId: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  lang: string;
  imageUri: string | null;
  releasedAt: string | null;
};

export type ResolvedItem = {
  oracleId: string;
  name: string;
  quantity: number;
  /** Impresión exacta pedida, o null si cualquiera sirve. */
  printing: CatalogPrinting | null;
  /** Impresión para mostrar (imagen, set): la exacta o la más reciente en inglés. */
  display: CatalogPrinting;
  foil: "yes" | "any";
  lineNumbers: number[];
};

export type ResolveIssue = { lineNumber: number; raw: string; message: string };

export type ResolveResult = {
  items: ResolvedItem[];
  warnings: ResolveIssue[];
  unresolved: ResolveIssue[];
};

/** Nombre normalizado para comparar: minúsculas, espacios simples, apóstrofo recto. */
export function normalizeCardName(name: string): string {
  return name.trim().toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ");
}

function frontFace(name: string): string {
  return normalizeCardName(name.split(" // ")[0]);
}

/** Nombres a buscar en el catálogo para estas líneas. */
export function namesToLookup(lines: ParsedLine[]): string[] {
  return [...new Set(lines.map((line) => normalizeCardName(line.name)))];
}

export function resolveLines(lines: ParsedLine[], candidates: CatalogPrinting[]): ResolveResult {
  const byName = new Map<string, CatalogPrinting[]>();
  for (const printing of candidates) {
    for (const key of new Set([normalizeCardName(printing.name), frontFace(printing.name)])) {
      const list = byName.get(key) ?? [];
      list.push(printing);
      byName.set(key, list);
    }
  }

  const items = new Map<string, ResolvedItem>();
  const warnings: ResolveIssue[] = [];
  const unresolved: ResolveIssue[] = [];

  for (const line of lines) {
    const matches = byName.get(normalizeCardName(line.name));
    if (!matches || matches.length === 0) {
      unresolved.push({ lineNumber: line.lineNumber, raw: line.raw, message: `No encontramos "${line.name}"` });
      continue;
    }

    const oracleId = mostPrinted(matches);
    const printings = matches.filter((p) => p.oracleId === oracleId);

    let exact: CatalogPrinting | null = null;
    if (line.setCode) {
      exact =
        printings.find(
          (p) => p.setCode === line.setCode && (line.collectorNumber === null || p.collectorNumber === line.collectorNumber),
        ) ?? null;
      if (!exact) {
        const where = [line.setCode.toUpperCase(), line.collectorNumber].filter(Boolean).join(" ");
        warnings.push({
          lineNumber: line.lineNumber,
          raw: line.raw,
          message: `No encontramos la impresión ${where}; se acepta cualquiera`,
        });
      }
    }

    const foil = line.foil ? "yes" : "any";
    const key = `${oracleId}|${exact?.id ?? ""}|${foil}`;
    const existing = items.get(key);
    if (existing) {
      existing.quantity += line.quantity;
      existing.lineNumbers.push(line.lineNumber);
      continue;
    }
    const display = exact ?? newestEnglish(printings);
    items.set(key, {
      oracleId,
      name: display.name,
      quantity: line.quantity,
      printing: exact,
      display,
      foil,
      lineNumbers: [line.lineNumber],
    });
  }

  return { items: [...items.values()], warnings, unresolved };
}

function mostPrinted(printings: CatalogPrinting[]): string {
  const counts = new Map<string, number>();
  for (const p of printings) counts.set(p.oracleId, (counts.get(p.oracleId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function newestEnglish(printings: CatalogPrinting[]): CatalogPrinting {
  const score = (p: CatalogPrinting) => [p.lang === "en" ? 1 : 0, p.imageUri ? 1 : 0, p.releasedAt ?? ""] as const;
  return [...printings].sort((a, b) => {
    const [la, ia, ra] = score(a);
    const [lb, ib, rb] = score(b);
    return lb - la || ib - ia || rb.localeCompare(ra);
  })[0];
}
