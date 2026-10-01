import { describe, expect, it } from "vitest";
import { parseDecklist } from "./decklist";

describe("parseDecklist", () => {
  it("lee cantidad, nombre, set y número", () => {
    const { lines, errors } = parseDecklist("1 Sol Ring (C21) 263");
    expect(errors).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        quantity: 1,
        name: "Sol Ring",
        setCode: "c21",
        collectorNumber: "263",
        foil: null,
      }),
    ]);
  });

  it("acepta líneas sin set, sin cantidad o con 'x'", () => {
    const { lines } = parseDecklist("4x Lightning Bolt\nCounterspell\n2 Brainstorm (STA)");
    expect(lines.map((l) => [l.quantity, l.name, l.setCode, l.collectorNumber])).toEqual([
      [4, "Lightning Bolt", null, null],
      [1, "Counterspell", null, null],
      [2, "Brainstorm", "sta", null],
    ]);
  });

  it("detecta foil y etched de Moxfield", () => {
    const { lines } = parseDecklist("1 Sol Ring (C21) 263 *F*\n1 Arcane Signet (CMR) 297 *E*");
    expect(lines.map((l) => l.foil)).toEqual([true, true]);
  });

  it("ignora encabezados, comentarios, líneas vacías y la sección About de Arena", () => {
    const text = [
      "About",
      "Name Mi mazo",
      "",
      "Commander",
      "1 Atraxa, Praetors' Voice (2XM) 190",
      "",
      "// rampa",
      "Deck",
      "1 Sol Ring",
      "SIDEBOARD:",
      "1 Name Sticker Goblin (UNF) 107",
    ].join("\n");
    const { lines, errors } = parseDecklist(text);
    expect(errors).toEqual([]);
    expect(lines.map((l) => l.name)).toEqual([
      "Atraxa, Praetors' Voice",
      "Sol Ring",
      "Name Sticker Goblin",
    ]);
  });

  it("conserva nombres con // y con paréntesis", () => {
    const { lines } = parseDecklist(
      "1 Delver of Secrets // Insectile Aberration (ISD) 51\n1 Erase (Not the Urza's Legacy One) (UNH) 26",
    );
    expect(lines.map((l) => [l.name, l.setCode])).toEqual([
      ["Delver of Secrets // Insectile Aberration", "isd"],
      ["Erase (Not the Urza's Legacy One)", "unh"],
    ]);
  });

  it("quita las etiquetas de Moxfield", () => {
    const { lines } = parseDecklist("1 Sol Ring (C21) 263 #ramp #!Commander\n1 Mox Opal ^Have,#37d67a^");
    expect(lines.map((l) => [l.name, l.collectorNumber])).toEqual([
      ["Sol Ring", "263"],
      ["Mox Opal", null],
    ]);
  });

  it("reporta cantidades fuera de rango con su número de línea", () => {
    const { lines, errors } = parseDecklist("1 Sol Ring\n0 Island");
    expect(lines).toHaveLength(1);
    expect(errors).toEqual([expect.objectContaining({ lineNumber: 2 })]);
  });
});
