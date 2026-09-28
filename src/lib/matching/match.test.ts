import { describe, expect, it } from "vitest";
import { type InventoryItem, type WantItem, allocate, bestCombinations, matchByStore } from "./match";

function want(overrides: Partial<WantItem> & Pick<WantItem, "id" | "oracleId">): WantItem {
  return { printingId: null, quantity: 1, minCondition: "LP", foil: "any", language: null, ...overrides };
}

let nextId = 0;
function stock(overrides: Partial<InventoryItem> & Pick<InventoryItem, "storeId" | "oracleId">): InventoryItem {
  return {
    id: `inv-${nextId++}`,
    printingId: `${overrides.oracleId}-p1`,
    condition: "NM",
    language: "en",
    foil: false,
    quantity: 1,
    priceMxnCents: 1000,
    ...overrides,
  };
}

describe("allocate", () => {
  it("acepta cualquier impresión si el item no pide una específica", () => {
    const result = allocate(
      [want({ id: "w1", oracleId: "sol-ring" })],
      [stock({ storeId: "a", oracleId: "sol-ring", printingId: "sol-ring-c21" })],
    );
    expect(result.coverage).toBe(1);
  });

  it("respeta la impresión específica", () => {
    const result = allocate(
      [want({ id: "w1", oracleId: "sol-ring", printingId: "sol-ring-lea" })],
      [stock({ storeId: "a", oracleId: "sol-ring", printingId: "sol-ring-c21" })],
    );
    expect(result.missing).toEqual([{ wantItemId: "w1", quantity: 1 }]);
  });

  it("filtra por condición mínima, foil e idioma", () => {
    const inventory = [
      stock({ storeId: "a", oracleId: "bolt", condition: "HP" }),
      stock({ storeId: "a", oracleId: "bolt", foil: true }),
      stock({ storeId: "a", oracleId: "bolt", language: "ja" }),
    ];
    expect(allocate([want({ id: "w", oracleId: "bolt", foil: "no", language: "en" })], inventory).coverage).toBe(0);
    expect(allocate([want({ id: "w", oracleId: "bolt", foil: "yes" })], inventory).coverage).toBe(1);
    expect(allocate([want({ id: "w", oracleId: "bolt", language: "ja" })], inventory).coverage).toBe(1);
    expect(allocate([want({ id: "w", oracleId: "bolt", minCondition: "DMG", quantity: 3 })], inventory).coverage).toBe(1);
  });

  it("toma las copias más baratas y cuenta cobertura por copias", () => {
    const result = allocate(
      [want({ id: "w1", oracleId: "bolt", quantity: 4 })],
      [
        stock({ storeId: "a", oracleId: "bolt", quantity: 2, priceMxnCents: 3000 }),
        stock({ storeId: "a", oracleId: "bolt", quantity: 1, priceMxnCents: 1000 }),
      ],
    );
    expect(result.coveredQuantity).toBe(3);
    expect(result.coverage).toBe(0.75);
    expect(result.totalMxnCents).toBe(7000);
    expect(result.missing).toEqual([{ wantItemId: "w1", quantity: 1 }]);
  });

  it("no deja que un item genérico le gane la única copia a uno específico", () => {
    const result = allocate(
      [
        want({ id: "cualquiera", oracleId: "sol-ring" }),
        want({ id: "especifico", oracleId: "sol-ring", printingId: "sol-ring-lea" }),
      ],
      [
        stock({ storeId: "a", oracleId: "sol-ring", printingId: "sol-ring-lea", priceMxnCents: 100 }),
        stock({ storeId: "a", oracleId: "sol-ring", printingId: "sol-ring-c21", priceMxnCents: 900 }),
      ],
    );
    expect(result.coverage).toBe(1);
  });
});

describe("matchByStore", () => {
  it("ordena por cobertura y omite tiendas sin nada", () => {
    const list = [want({ id: "w1", oracleId: "bolt" }), want({ id: "w2", oracleId: "ring" })];
    const results = matchByStore(list, [
      stock({ storeId: "chica", oracleId: "bolt" }),
      stock({ storeId: "grande", oracleId: "bolt" }),
      stock({ storeId: "grande", oracleId: "ring" }),
      stock({ storeId: "otra", oracleId: "forest" }),
    ]);
    expect(results.map((r) => [r.storeIds, r.coverage])).toEqual([
      [["grande"], 1],
      [["chica"], 0.5],
    ]);
  });
});

describe("bestCombinations", () => {
  const list = [
    want({ id: "w1", oracleId: "bolt" }),
    want({ id: "w2", oracleId: "ring" }),
    want({ id: "w3", oracleId: "opal" }),
  ];
  const inventory = [
    stock({ storeId: "a", oracleId: "bolt", priceMxnCents: 500 }),
    stock({ storeId: "a", oracleId: "ring", priceMxnCents: 5000 }),
    stock({ storeId: "b", oracleId: "ring", priceMxnCents: 1000 }),
    stock({ storeId: "c", oracleId: "opal", priceMxnCents: 2000 }),
    stock({ storeId: "d", oracleId: "bolt", priceMxnCents: 400 }),
  ];

  it("encuentra la combinación que cubre toda la lista al menor costo", () => {
    const [best] = bestCombinations(list, inventory);
    expect(best.storeIds).toEqual(["b", "c", "d"]);
    expect(best.coverage).toBe(1);
    expect(best.totalMxnCents).toBe(3400);
  });

  it("respeta el máximo de tiendas aunque salga más caro", () => {
    const [best] = bestCombinations(list, inventory, { maxStores: 2 });
    expect(best.storeIds).toEqual(["a", "c"]);
    expect(best.coverage).toBe(1);
    expect(best.totalMxnCents).toBe(7500);
  });

  it("descarta combinaciones con tiendas que no aportan nada", () => {
    const results = bestCombinations(list, inventory, { limit: 100 });
    for (const result of results) {
      expect(new Set(result.allocations.map((a) => a.storeId)).size).toBe(result.storeIds.length);
    }
  });
});
