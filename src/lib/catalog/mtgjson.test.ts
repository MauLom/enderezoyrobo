import { describe, expect, it } from "vitest";
import { type AllPricesToday, scryfallIdsByUuid, toCardKingdomPrices } from "./mtgjson";

const ids = scryfallIdsByUuid([
  ["uuid", "scryfallId", "cardKingdomId"],
  ["sol-ring-uuid", "sol-ring-c21", "1"],
  ["delver-frente", "delver-isd", "2"],
  ["delver-reverso", "delver-isd", ""],
  ["sin-scryfall", "", "3"],
  ["solo-mtgo", "solo-mtgo-id", ""],
]);
const known = new Set(["sol-ring-c21", "delver-isd"]);

function prices(data: AllPricesToday["data"]): AllPricesToday {
  return { meta: { date: "2026-10-02" }, data };
}

describe("scryfallIdsByUuid", () => {
  it("busca las columnas por nombre y omite los uuid sin id de Scryfall", () => {
    expect(ids.get("sol-ring-uuid")).toBe("sol-ring-c21");
    expect(ids.has("sin-scryfall")).toBe(false);
    expect(ids.size).toBe(4);
  });

  it("falla si el archivo no trae las columnas", () => {
    expect(() => scryfallIdsByUuid([["id", "name"]])).toThrow(/uuid y scryfallId/);
  });
});

describe("toCardKingdomPrices", () => {
  it("toma el precio de venta por acabado, no el de compra", () => {
    const rows = toCardKingdomPrices(
      prices({
        "sol-ring-uuid": {
          paper: {
            cardkingdom: {
              currency: "USD",
              retail: { normal: { "2026-10-02": 1.99 }, foil: { "2026-10-02": 5.49 }, etched: { "2026-10-02": 7 } },
              buylist: { normal: { "2026-10-02": 0.8 } },
            },
            tcgplayer: { currency: "USD", retail: { normal: { "2026-10-02": 1.5 } } },
          },
        },
      }),
      ids,
      known,
    );
    expect(rows).toEqual([
      { printingId: "sol-ring-c21", source: "ck", finish: "nonfoil", currency: "USD", amount: "1.99", asOf: "2026-10-02" },
      { printingId: "sol-ring-c21", source: "ck", finish: "foil", currency: "USD", amount: "5.49", asOf: "2026-10-02" },
      { printingId: "sol-ring-c21", source: "ck", finish: "etched", currency: "USD", amount: "7.00", asOf: "2026-10-02" },
    ]);
  });

  it("usa la fecha más reciente si vienen varias", () => {
    const [row] = toCardKingdomPrices(
      prices({ "sol-ring-uuid": { paper: { cardkingdom: { currency: "USD", retail: { normal: { "2026-10-02": 2.25, "2026-10-01": 1.99 } } } } } }),
      ids,
      known,
    );
    expect(row).toMatchObject({ amount: "2.25", asOf: "2026-10-02" });
  });

  it("una carta de dos caras da un solo precio por acabado", () => {
    const ck = { cardkingdom: { currency: "USD", retail: { normal: { "2026-10-02": 0.25 } } } };
    const rows = toCardKingdomPrices(prices({ "delver-frente": { paper: ck }, "delver-reverso": { paper: ck } }), ids, known);
    expect(rows).toHaveLength(1);
  });

  it("ignora uuid sin cruce, impresiones que no guardamos y cartas sin precio de CK", () => {
    const ck = { cardkingdom: { currency: "USD", retail: { normal: { "2026-10-02": 1 } } } };
    const rows = toCardKingdomPrices(
      prices({
        "sin-scryfall": { paper: ck },
        "solo-mtgo": { paper: ck },
        "uuid-desconocido": { paper: ck },
        "sol-ring-uuid": { paper: { cardkingdom: { currency: "USD", retail: {} } } },
      }),
      ids,
      known,
    );
    expect(rows).toEqual([]);
  });
});
