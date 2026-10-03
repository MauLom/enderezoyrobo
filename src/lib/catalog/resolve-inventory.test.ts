import { describe, expect, it } from "vitest";
import { parseStoreInventory } from "@/lib/import/store-inventory";
import type { CatalogPrinting } from "./resolve";
import { inventoryLimitError, resolveInventory, SELLER_CARD_LIMIT } from "./resolve-inventory";

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
const forest1 = printing({ id: "forest-1", oracleId: "forest", name: "Forest", setCode: "blb", collectorNumber: "279" });
const forest2 = printing({ id: "forest-2", oracleId: "forest", name: "Forest", setCode: "blb", collectorNumber: "280" });
const forest10 = printing({ id: "forest-10", oracleId: "forest", name: "Forest", setCode: "blb", collectorNumber: "1000" });
const delver = printing({ id: "delver", oracleId: "delver", name: "Delver of Secrets // Insectile Aberration", setCode: "isd", collectorNumber: "51" });

const catalog = [solRingC21, solRingCmm, forest10, forest2, forest1, delver];

function resolve(body: string) {
  const parsed = parseStoreInventory(`carta,set,numero,condicion,idioma,foil,cantidad,precio\n${body}`);
  expect(parsed.errors).toEqual([]);
  return resolveInventory(parsed.rows, catalog);
}

describe("resolveInventory", () => {
  it("con set y número usa esa impresión exacta, sin avisos", () => {
    const { items, warnings, errors } = resolve("Sol Ring,C21,263,NM,Inglés,No,3,45");
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(items).toEqual([
      {
        key: "sol-c21|NM|en|false",
        printing: solRingC21,
        condition: "NM",
        language: "en",
        foil: false,
        quantity: 3,
        priceMxnCents: 4500,
        rowNumbers: [2],
      },
    ]);
  });

  it("sin set usa la más reciente en inglés y avisa", () => {
    const { items, warnings } = resolve("Sol Ring,,,LP,,No,1,40");
    expect(items[0].printing.id).toBe("sol-cmm");
    expect(warnings).toEqual([{ rowNumber: 2, message: "Sol Ring: sin set, se usó CMM 410" }]);
  });

  it("set inexistente usa la más reciente en inglés y avisa", () => {
    const { items, warnings, errors } = resolve("Sol Ring,ZZZ,1,NM,,No,1,40");
    expect(errors).toEqual([]);
    expect(items[0].printing.id).toBe("sol-cmm");
    expect(warnings[0].message).toBe("Sol Ring: no encontramos ZZZ 1, se usó CMM 410");
  });

  it("set sin número toma el menor número de colección y avisa si hay varios", () => {
    const { items, warnings } = resolve("Forest,BLB,,NM,,No,10,2");
    expect(items[0].printing.id).toBe("forest-1");
    expect(warnings[0].message).toBe("Forest: hay 3 impresiones en BLB, se usó BLB 279");
    expect(resolve("Sol Ring,C21,,NM,,No,1,40").warnings).toEqual([]);
  });

  it("encuentra cartas de dos caras por la cara frontal", () => {
    const { items, errors } = resolve("Delver of Secrets,ISD,51,NM,,No,4,15");
    expect(errors).toEqual([]);
    expect(items[0].printing.id).toBe("delver");
  });

  it("suma renglones repetidos y separa condición, idioma y foil", () => {
    const { items } = resolve(
      ["Sol Ring,C21,263,NM,,No,1,45", "Sol Ring,C21,263,NM,,No,2,45", "Sol Ring,C21,263,LP,,No,1,40", "Sol Ring,C21,263,NM,Español,No,1,45", "Sol Ring,C21,263,NM,,Sí,1,90"].join("\n"),
    );
    expect(items.map((i) => [i.key, i.quantity])).toEqual([
      ["sol-c21|NM|en|false", 3],
      ["sol-c21|LP|en|false", 1],
      ["sol-c21|NM|es|false", 1],
      ["sol-c21|NM|en|true", 1],
    ]);
  });

  it("es error repetir la misma impresión con otro precio o una carta que no existe", () => {
    const { errors, items } = resolve(["Sol Ring,C21,263,NM,,No,1,45", "Sol Ring,C21,263,NM,,No,1,50", "Ponderr,,,NM,,No,1,5"].join("\n"));
    expect(items).toHaveLength(1);
    expect(errors).toEqual([
      { rowNumber: 3, message: "Sol Ring repite la línea 2 (misma impresión, condición, idioma y foil) con otro precio" },
      { rowNumber: 4, message: 'No encontramos "Ponderr" en el catálogo' },
    ]);
  });

  it("no guarda cantidad 0", () => {
    const { items, warnings } = resolve("Sol Ring,C21,263,NM,,No,0,45");
    expect(items).toEqual([]);
    expect(warnings[0].message).toBe("Sol Ring: cantidad 0, no se guarda");
  });
});

describe("inventoryLimitError", () => {
  const items = (quantity: number) => resolve(`Sol Ring,C21,263,NM,,No,${quantity},45`).items;

  it("limita a los vendedores sin tienda", () => {
    expect(inventoryLimitError("seller", items(SELLER_CARD_LIMIT))).toBeNull();
    expect(inventoryLimitError("seller", items(SELLER_CARD_LIMIT + 1))).toMatch(/hasta 100 cartas y el archivo trae 101/);
  });

  it("las tiendas no tienen límite", () => {
    expect(inventoryLimitError("store", items(5000))).toBeNull();
  });
});
