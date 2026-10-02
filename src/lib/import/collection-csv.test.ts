import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { looksLikeCollectionCsv, parseCollectionCsv } from "./collection-csv";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

describe("parseCollectionCsv", () => {
  it("lee el CSV de ManaBox con ID de Scryfall y foil", () => {
    const { format, lines, errors } = parseCollectionCsv(fixture("manabox-ejemplo.csv"));
    expect(format).toBe("manabox");
    expect(errors).toEqual([]);
    expect(lines.map(({ quantity, name, setCode, collectorNumber, foil }) => ({ quantity, name, setCode, collectorNumber, foil }))).toEqual([
      { quantity: 2, name: "Ragavan, Nimble Pilferer", setCode: "mh2", collectorNumber: "138", foil: null },
      { quantity: 1, name: "Lightning Bolt", setCode: "m19", collectorNumber: "204", foil: true },
      { quantity: 1, name: "Sword of Fire and Ice", setCode: "m21", collectorNumber: "287", foil: null },
    ]);
    expect(lines[0].scryfallId).toBe("0a1b2c3d-4e5f-6789-abcd-ef0123456789");
    expect(lines[0].lineNumber).toBe(2);
    expect(lines[0].raw).toBe("2 Ragavan, Nimble Pilferer (MH2) 138");
  });

  it("lee el CSV de Moxfield (Count y Edition)", () => {
    const { format, lines, errors } = parseCollectionCsv(fixture("moxfield-ejemplo.csv"));
    expect(format).toBe("moxfield");
    expect(errors).toEqual([]);
    expect(lines.map((l) => [l.quantity, l.name, l.setCode, l.collectorNumber, l.foil, l.scryfallId])).toEqual([
      [2, "Ragavan, Nimble Pilferer", "mh2", "138", null, null],
      [1, "Lightning Bolt", "m19", "204", true, null],
      [1, "Sword of Fire and Ice", "m21", "287", null, null],
    ]);
  });

  it("acepta un CSV genérico con punto y coma, etched y sin set", () => {
    const { format, lines } = parseCollectionCsv("Nombre;Cantidad;Foil\nSol Ring;1;etched\n");
    expect(format).toBe("csv");
    expect(lines[0]).toMatchObject({ name: "Sol Ring", quantity: 1, setCode: null, collectorNumber: null, foil: true });
  });

  it("reporta filas sin nombre o con cantidad inválida y sigue con las demás", () => {
    const { lines, errors } = parseCollectionCsv("Name,Quantity\n,2\nSol Ring,dos\nSol Ring,0\nCounterspell,4\n");
    expect(lines.map((l) => l.name)).toEqual(["Counterspell"]);
    expect(errors.map((e) => e.lineNumber)).toEqual([2, 3, 4]);
  });

  it("sin columnas de nombre y cantidad no lee nada", () => {
    const { lines, errors } = parseCollectionCsv("Carta,Set\nSol Ring,C21\n");
    expect(lines).toEqual([]);
    expect(errors[0].message).toMatch(/nombre y cantidad/);
  });
});

describe("looksLikeCollectionCsv", () => {
  it("reconoce los encabezados de ManaBox y Moxfield", () => {
    expect(looksLikeCollectionCsv(fixture("manabox-ejemplo.csv"))).toBe(true);
    expect(looksLikeCollectionCsv(fixture("moxfield-ejemplo.csv"))).toBe(true);
  });

  it("no confunde una lista en texto con comas en el nombre", () => {
    expect(looksLikeCollectionCsv("1 Atraxa, Praetors' Voice\n4 Lightning Bolt")).toBe(false);
    expect(looksLikeCollectionCsv("Deck\n1 Sol Ring (C21) 263")).toBe(false);
  });
});
