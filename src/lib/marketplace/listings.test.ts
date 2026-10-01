import { describe, expect, it } from "vitest";
import { groupListings, initials, type MarketOffer, searchListings, summarizeWishlist } from "./listings";

function offer(overrides: Partial<MarketOffer>): MarketOffer {
  return {
    id: "o1",
    oracleId: "sol-ring",
    cardName: "Sol Ring",
    setCode: "C21",
    setName: "Commander 2021",
    imageUri: "https://img/sol-ring.jpg",
    condition: "NM",
    language: "en",
    foil: false,
    quantity: 1,
    priceMxnCents: 5000,
    sellerId: "dragon",
    sellerName: "El Dragón",
    isStore: true,
    verified: true,
    whatsapp: "8112345678",
    location: "San Pedro",
    updatedAt: "2026-09-28T00:00:00Z",
    ...overrides,
  };
}

describe("groupListings", () => {
  it("agrupa por carta con la oferta más barata primero", () => {
    const [listing] = groupListings([
      offer({ id: "a", priceMxnCents: 7000, sellerId: "dragon" }),
      offer({ id: "b", priceMxnCents: 4500, sellerId: "guarida", setCode: "2X2", condition: "LP" }),
      offer({ id: "c", priceMxnCents: 6000, sellerId: "dragon" }),
    ]);
    expect(listing.offers.map((o) => o.id)).toEqual(["b", "c", "a"]);
    expect(listing).toMatchObject({ bestPriceMxnCents: 4500, setCode: "2X2", condition: "LP", sellerCount: 2 });
  });

  it("ignora ofertas sin existencias y repetidas", () => {
    const listings = groupListings([offer({ id: "a" }), offer({ id: "a" }), offer({ id: "b", quantity: 0 })]);
    expect(listings[0].offers).toHaveLength(1);
  });

  it("pone primero las cartas buscadas y luego las más recientes", () => {
    const listings = groupListings(
      [
        offer({ id: "a", oracleId: "viejo", cardName: "Viejo", updatedAt: "2026-09-01T00:00:00Z" }),
        offer({ id: "b", oracleId: "nuevo", cardName: "Nuevo", updatedAt: "2026-09-29T00:00:00Z" }),
        offer({ id: "c", oracleId: "buscado", cardName: "Buscado", updatedAt: "2026-08-01T00:00:00Z" }),
      ],
      new Set(["buscado"]),
    );
    expect(listings.map((l) => l.name)).toEqual(["Buscado", "Nuevo", "Viejo"]);
    expect(listings[0].wanted).toBe(true);
  });

  it("usa la imagen de otra oferta si la más barata no tiene", () => {
    const [listing] = groupListings([
      offer({ id: "a", priceMxnCents: 100, imageUri: null }),
      offer({ id: "b", priceMxnCents: 200, imageUri: "https://img/otra.jpg" }),
    ]);
    expect(listing.imageUri).toBe("https://img/otra.jpg");
  });
});

describe("searchListings", () => {
  const listings = groupListings([
    offer({ id: "a", oracleId: "1", cardName: "Sol Ring" }),
    offer({ id: "b", oracleId: "2", cardName: "Éowyn, Fearless Knight" }),
  ]);

  it("busca sin distinguir mayúsculas ni acentos", () => {
    expect(searchListings(listings, "eowyn").map((l) => l.name)).toEqual(["Éowyn, Fearless Knight"]);
    expect(searchListings(listings, "SOL").map((l) => l.name)).toEqual(["Sol Ring"]);
  });

  it("con menos de 2 letras no filtra", () => {
    expect(searchListings(listings, "s")).toHaveLength(2);
  });
});

describe("summarizeWishlist", () => {
  it("cuenta ofertas por carta, suma repetidas y pone primero las disponibles", () => {
    const listings = groupListings([offer({ id: "a" }), offer({ id: "b", sellerId: "guarida", priceMxnCents: 4000 })]);
    const cards = summarizeWishlist(
      [
        { listId: "a", oracleId: "mana-vault", name: "Mana Vault", setCode: null, quantity: 1 },
        { listId: "a", oracleId: "sol-ring", name: "Sol Ring", setCode: "C21", quantity: 1 },
        { listId: "b", oracleId: "sol-ring", name: "Sol Ring", setCode: "C21", quantity: 2 },
      ],
      listings,
    );
    expect(cards).toEqual([
      { oracleId: "sol-ring", name: "Sol Ring", setCode: "C21", quantity: 3, offerCount: 2, bestPriceMxnCents: 4000 },
      { oracleId: "mana-vault", name: "Mana Vault", setCode: null, quantity: 1, offerCount: 0, bestPriceMxnCents: null },
    ]);
  });
});

describe("initials", () => {
  it("toma la primera y la última palabra", () => {
    expect(initials("Javier Peña")).toBe("JP");
    expect(initials("Beto Ruiz (prueba)")).toBe("BR");
    expect(initials("mazo")).toBe("MA");
    expect(initials("  ")).toBe("?");
  });
});
