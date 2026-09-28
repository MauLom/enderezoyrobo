/**
 * Parser de listas en texto estilo Moxfield / Arena / ManaBox:
 *
 *   1 Sol Ring (C21) 263
 *   1x Sol Ring
 *   Sol Ring
 *   4 Lightning Bolt (STA) 42 *F*
 *
 * Set y número son opcionales; si faltan, la carta se resuelve por nombre y se
 * acepta cualquier impresión.
 */

export type ParsedLine = {
  lineNumber: number;
  raw: string;
  quantity: number;
  name: string;
  setCode: string | null;
  collectorNumber: string | null;
  /** true si la línea trae *F* o *E* (etched); null si no dice nada. */
  foil: boolean | null;
};

export type LineError = {
  lineNumber: number;
  raw: string;
  message: string;
};

export type DecklistResult = {
  lines: ParsedLine[];
  errors: LineError[];
};

/** Encabezados de sección que exportan Moxfield y Arena. */
const SECTION_HEADERS = new Set([
  "deck",
  "mainboard",
  "sideboard",
  "commander",
  "commanders",
  "companion",
  "maybeboard",
  "considering",
  "tokens",
  "about",
]);

const MAX_QUANTITY = 999;

// cantidad opcional ("4", "4x"), nombre, "(SET) número" opcional y marca de foil opcional.
const LINE_RE =
  /^(?:(\d+)x?\s+)?(.+?)(?:\s+\(([A-Za-z0-9]{2,6})\)(?:\s+(\S+))?)?(?:\s+\*([FE])\*)?$/;

export function parseDecklist(text: string): DecklistResult {
  const lines: ParsedLine[] = [];
  const errors: LineError[] = [];

  // La sección "About" de Arena trae metadatos ("Name Mi mazo") hasta la
  // siguiente línea en blanco.
  let inAbout = false;

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNumber = index + 1;
    const line = cleanLine(raw);
    if (raw.trim() === "") inAbout = false;
    if (line === "" || inAbout) return;
    const header = sectionHeader(line);
    if (header) {
      inAbout = header === "about";
      return;
    }

    const match = LINE_RE.exec(line);
    const name = match?.[2]?.trim();
    if (!match || !name) {
      errors.push({ lineNumber, raw, message: "No se reconoce el formato de la línea" });
      return;
    }

    const quantity = match[1] === undefined ? 1 : Number(match[1]);
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      errors.push({ lineNumber, raw, message: `Cantidad inválida: ${match[1]}` });
      return;
    }

    lines.push({
      lineNumber,
      raw,
      quantity,
      name,
      setCode: match[3]?.toLowerCase() ?? null,
      collectorNumber: match[4] ?? null,
      foil: match[5] ? true : null,
    });
  });

  return { lines, errors };
}

function cleanLine(raw: string): string {
  let line = raw.trim();
  if (line.startsWith("//") || line.startsWith("#")) return "";
  // Etiquetas de Moxfield: "#ramp", "#!Commander" y "^Have,#37d67a^".
  line = line.replace(/\s\^[^^]*\^/g, "").replace(/\s#\S.*$/, "");
  return line.trim();
}

function sectionHeader(line: string): string | null {
  const normalized = line.replace(/:$/, "").trim().toLowerCase();
  return SECTION_HEADERS.has(normalized) ? normalized : null;
}
