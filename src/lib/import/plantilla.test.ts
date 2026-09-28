import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseStoreInventory } from "./store-inventory";

it("la plantilla pública de inventario se importa sin errores", () => {
  const csv = readFileSync(new URL("../../../public/plantilla-inventario.csv", import.meta.url), "utf8");
  const { rows, errors, warnings } = parseStoreInventory(csv);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
  expect(rows).toHaveLength(2);
});
