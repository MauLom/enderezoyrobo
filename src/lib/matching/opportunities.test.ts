import { describe, expect, it } from "vitest";
import type { InventoryItem, WantItem } from "./match";
import { rankOpportunities } from "./opportunities";

function want(id: string, oracleId: string, quantity = 1): WantItem {
  return { id, oracleId, printingId: null, quantity, minCondition: "LP", foil: "any", language: null };
}

function stock(id: string, oracleId: string, quantity: number, priceMxnCents: number): InventoryItem {
  return { id, storeId: "yo", oracleId, printingId: `${oracleId}-p1`, condition: "NM", language: "en", foil: false, quantity, priceMxnCents };
}

describe("rankOpportunities", () => {
  const inventory = [stock("i1", "bolt", 4, 2000), stock("i2", "ring", 1, 4500)];

  it("omite las listas que el inventario no cubre", () => {
    const result = rankOpportunities([{ id: "nada", items: [want("w1", "tutor")] }], inventory);
    expect(result).toEqual([]);
  });

  it("ordena por cobertura y luego por monto", () => {
    const result = rankOpportunities(
      [
        { id: "mitad", items: [want("a1", "bolt", 4), want("a2", "tutor", 4)] },
        { id: "barata", items: [want("b1", "bolt", 1)] },
        { id: "cara", items: [want("c1", "ring", 1)] },
      ],
      inventory,
    );
    expect(result.map((o) => o.listId)).toEqual(["cara", "barata", "mitad"]);
    expect(result[2].result.coverage).toBe(0.5);
    expect(result[2].result.totalMxnCents).toBe(8000);
  });
});
