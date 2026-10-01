import { describe, expect, it } from "vitest";
import { parseDecklist } from "@/lib/import/decklist";
import { type CatalogPrinting, namesToLookup, normalizeCardName, resolveLines } from "./resolve";

function printing(overrides: Partial<CatalogPrinting>): CatalogPrinting {
  return {
    id: "p",
    oracleId: "o",
    name: "Carta",
    setCode: "set",
    setName: "Set",
    collectorNumber: "1",
    lang: "en",
    imageUri: "https://img/p.jpg",
    releasedAt: "2020-01-01",
    ...overrides,
  };
}

const solRingC21 = printing({ id: "sol-c21", oracleId: "sol", name: "Sol Ring", setCode: "c21", collectorNumber: "263", releasedAt: "2021-04-23" });
const solRingCmm = printing({ id: "sol-cmm", oracleId: "sol", name: "Sol Ring", setCode: "cmm", collectorNumber: "410", releasedAt: "2023-08-04" });
const solRingJa = printing({ id: "sol-ja", oracleId: "sol", name: "Sol Ring", setCode: "sta", lang: "ja", releasedAt: "2024-01-01" });
const delver = printing({ id: "delver", oracleId: "delver", name: "Delver of Secrets // Insectile Aberration" });
const treasureCard = printing({ id: "t-card", oracleId: "treasure-card", name: "Treasure" });
const treasureToken1 = printing({ id: "t-1", oracleId: "treasure-token", name: "Treasure" });
const treasureToken2 = printing({ id: "t-2", oracleId: "treasure-token", name: "Treasure" });

const catalog = [solRingC21, solRingCmm, solRingJa, delver, treasureCard, treasureToken1, treasureToken2];

function resolve(text: string) {
  return resolveLines(parseDecklist(text).lines, catalog);
}

describe("resolveLines", () => {
  it("sin set acepta cualquier impresión y muestra la más reciente en inglés", () => {
    const { items } = resolve("1 Sol Ring");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ oracleId: "sol", printing: null, quantity: 1, foil: "any" });
    expect(items[0].display.id).toBe("sol-cmm");
  });

  it("con set y número pide esa impresión exacta", () => {
    const { items, warnings } = resolve("1 Sol Ring (C21) 263");
    expect(items[0].printing?.id).toBe("sol-c21");
    expect(warnings).toEqual([]);
  });

  it("con ID de Scryfall pide esa impresión aunque el set no coincida", () => {
    const line = { ...parseDecklist("1 Sol Ring (c21) 263").lines[0], scryfallId: "sol-cmm" };
    const { items, warnings } = resolveLines([line], catalog);
    expect(items[0].printing?.id).toBe("sol-cmm");
    expect(warnings).toEqual([]);
  });

  it("si el ID de Scryfall no está en el catálogo usa set y número", () => {
    const line = { ...parseDecklist("1 Sol Ring (c21) 263").lines[0], scryfallId: "no-existe" };
    expect(resolveLines([line], catalog).items[0].printing?.id).toBe("sol-c21");
  });

  it("si la impresión no existe acepta cualquiera y avisa", () => {
    const { items, warnings } = resolve("1 Sol Ring (2X2) 190");
    expect(items[0].printing).toBeNull();
    expect(warnings[0].message).toBe("No encontramos la impresión 2X2 190; se acepta cualquiera");
  });

  it("encuentra cartas de dos caras por la cara frontal", () => {
    expect(resolve("4 Delver of Secrets").items[0].oracleId).toBe("delver");
  });

  it("ignora mayúsculas y apóstrofos curvos", () => {
    expect(normalizeCardName("  SOL   ring ")).toBe("sol ring");
    expect(normalizeCardName("Atraxa, Praetors’ Voice")).toBe("atraxa, praetors' voice");
  });

  it("con nombres repetidos gana la carta con más impresiones", () => {
    expect(resolve("1 Treasure").items[0].oracleId).toBe("treasure-token");
  });

  it("suma líneas repetidas y separa foil", () => {
    const { items } = resolve("2 Sol Ring\n1 Sol Ring\n1 Sol Ring *F*");
    expect(items.map((i) => [i.quantity, i.foil, i.lineNumbers])).toEqual([
      [3, "any", [1, 2]],
      [1, "yes", [3]],
    ]);
  });

  it("reporta las cartas que no están en el catálogo", () => {
    const { items, unresolved } = resolve("1 Sol Rign");
    expect(items).toEqual([]);
    expect(unresolved).toEqual([{ lineNumber: 1, raw: "1 Sol Rign", message: 'No encontramos "Sol Rign"' }]);
  });

  it("namesToLookup normaliza y quita repetidos", () => {
    expect(namesToLookup(parseDecklist("1 Sol Ring\n2 sol ring\n1 Delver of Secrets").lines)).toEqual([
      "sol ring",
      "delver of secrets",
    ]);
  });
});
