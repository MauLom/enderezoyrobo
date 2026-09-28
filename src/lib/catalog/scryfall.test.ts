import { describe, expect, it } from "vitest";
import { type ScryfallCard, toPrices, toPrinting } from "./scryfall";

const forest: ScryfallCard = {
  id: "0000419b-0bba-4488-8f7a-6194544ce91e",
  oracle_id: "b34bb2dc-c1af-4d77-b0b3-a0fb342a5fc6",
  name: "Forest",
  set: "blb",
  set_name: "Bloomburrow",
  collector_number: "280",
  lang: "en",
  rarity: "common",
  released_at: "2024-08-02",
  layout: "normal",
  games: ["paper", "mtgo", "arena"],
  image_uris: { normal: "https://cards.scryfall.io/normal/front/forest.jpg" },
  prices: { usd: "0.38", usd_foil: "0.53", usd_etched: null, eur: "0.31", eur_foil: "0.54", tix: "0.03" },
};

describe("toPrinting", () => {
  it("convierte una carta de papel", () => {
    expect(toPrinting(forest)).toEqual({
      id: forest.id,
      oracleId: forest.oracle_id,
      name: "Forest",
      setCode: "blb",
      setName: "Bloomburrow",
      collectorNumber: "280",
      lang: "en",
      rarity: "common",
      imageUri: "https://cards.scryfall.io/normal/front/forest.jpg",
      releasedAt: "2024-08-02",
    });
  });

  it("descarta cartas solo digitales y art series", () => {
    expect(toPrinting({ ...forest, games: ["arena"] })).toBeNull();
    expect(toPrinting({ ...forest, layout: "art_series" })).toBeNull();
  });

  it("toma oracle id e imagen de la primera cara si no vienen arriba", () => {
    const reversible: ScryfallCard = {
      ...forest,
      oracle_id: undefined,
      image_uris: undefined,
      layout: "reversible_card",
      card_faces: [
        { oracle_id: "cara-1", image_uris: { normal: "https://img/cara-1.jpg" } },
        { oracle_id: "cara-2", image_uris: { normal: "https://img/cara-2.jpg" } },
      ],
    };
    expect(toPrinting(reversible)).toMatchObject({ oracleId: "cara-1", imageUri: "https://img/cara-1.jpg" });
  });
});

describe("toPrices", () => {
  it("separa fuente, acabado y moneda, e ignora precios vacíos y de MTGO", () => {
    expect(toPrices(forest, "2026-09-28")).toEqual([
      { printingId: forest.id, source: "tcgplayer", finish: "nonfoil", currency: "USD", amount: "0.38", asOf: "2026-09-28" },
      { printingId: forest.id, source: "tcgplayer", finish: "foil", currency: "USD", amount: "0.53", asOf: "2026-09-28" },
      { printingId: forest.id, source: "cardmarket", finish: "nonfoil", currency: "EUR", amount: "0.31", asOf: "2026-09-28" },
      { printingId: forest.id, source: "cardmarket", finish: "foil", currency: "EUR", amount: "0.54", asOf: "2026-09-28" },
    ]);
  });
});
