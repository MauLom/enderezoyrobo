/** Condiciones de carta, de mejor a peor. */
export const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

export type Condition = (typeof CONDITIONS)[number];

const ALIASES: Record<string, Condition> = {
  nm: "NM",
  "near mint": "NM",
  mint: "NM",
  m: "NM",
  "casi nueva": "NM",
  lp: "LP",
  "lightly played": "LP",
  "slightly played": "LP",
  sp: "LP",
  ex: "LP",
  excellent: "LP",
  "poco jugada": "LP",
  mp: "MP",
  "moderately played": "MP",
  played: "MP",
  pl: "MP",
  gd: "MP",
  good: "MP",
  "jugada": "MP",
  hp: "HP",
  "heavily played": "HP",
  "muy jugada": "HP",
  dmg: "DMG",
  damaged: "DMG",
  poor: "DMG",
  po: "DMG",
  "dañada": "DMG",
};

/** Convierte texto libre ("Near Mint", "lp", "Casi nueva") a una condición. */
export function parseCondition(raw: string): Condition | null {
  const key = raw.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return ALIASES[key] ?? null;
}

/** true si `actual` es igual o mejor que `minimum`. */
export function meetsMinimum(actual: Condition, minimum: Condition): boolean {
  return CONDITIONS.indexOf(actual) <= CONDITIONS.indexOf(minimum);
}
