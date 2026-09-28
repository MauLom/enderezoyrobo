import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import { parseStoreInventory } from "./store-inventory";

describe("parseCsv", () => {
  it("maneja comillas, comas y saltos de línea dentro de campos", () => {
    expect(parseCsv('a,b\n"Atraxa, Praetors\' Voice","dice ""hola""\nadiós"\r\n')).toEqual([
      ["a", "b"],
      ["Atraxa, Praetors' Voice", 'dice "hola"\nadiós'],
    ]);
  });

  it("detecta punto y coma como separador (Excel en español)", () => {
    expect(parseCsv("carta;cantidad\nSol Ring;3")).toEqual([
      ["carta", "cantidad"],
      ["Sol Ring", "3"],
    ]);
  });
});

describe("parseStoreInventory", () => {
  it("lee la plantilla completa", () => {
    const csv = [
      "Carta,Set,Número,Condición,Idioma,Foil,Cantidad,Precio",
      "Sol Ring,C21,263,NM,Inglés,No,3,45",
      '"Atraxa, Praetors\' Voice",2X2,190,Lightly Played,Español,Sí,1,"$1,234.50"',
    ].join("\n");
    const { rows, errors, warnings } = parseStoreInventory(csv);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(rows).toEqual([
      {
        rowNumber: 2,
        name: "Sol Ring",
        setCode: "c21",
        collectorNumber: "263",
        condition: "NM",
        language: "en",
        foil: false,
        quantity: 3,
        priceMxnCents: 4500,
      },
      {
        rowNumber: 3,
        name: "Atraxa, Praetors' Voice",
        setCode: "2x2",
        collectorNumber: "190",
        condition: "LP",
        language: "es",
        foil: true,
        quantity: 1,
        priceMxnCents: 123450,
      },
    ]);
  });

  it("pide las columnas obligatorias", () => {
    const { rows, errors } = parseStoreInventory("carta,set\nSol Ring,C21");
    expect(rows).toEqual([]);
    expect(errors[0].message).toContain("cantidad, precio");
  });

  it("asume NM e inglés cuando faltan esas columnas", () => {
    const { rows, warnings } = parseStoreInventory("name,qty,price\nSol Ring,2,40.5");
    expect(warnings).toHaveLength(1);
    expect(rows[0]).toMatchObject({ condition: "NM", language: "en", foil: false, priceMxnCents: 4050 });
  });

  it("reporta filas inválidas sin descartar las buenas", () => {
    const csv = [
      "carta,condicion,cantidad,precio",
      "Sol Ring,NM,3,45",
      "Island,Regular,1,5",
      "Swamp,NM,-1,5",
      "Forest,NM,1,cinco",
    ].join("\n");
    const { rows, errors } = parseStoreInventory(csv);
    expect(rows.map((r) => r.name)).toEqual(["Sol Ring"]);
    expect(errors.map((e) => e.rowNumber)).toEqual([3, 4, 5]);
  });
});
