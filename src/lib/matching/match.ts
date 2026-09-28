import { type Condition, meetsMinimum } from "@/lib/cards/condition";

/**
 * Matching entre una want list y el inventario de las tiendas. Trabaja con
 * cartas ya resueltas a IDs de Scryfall; resolver nombres a IDs es trabajo del
 * catálogo.
 *
 * Reglas (docs/07-datos-y-fuentes.md):
 * - Un item sin impresión específica acepta cualquier printing del mismo oracle id.
 * - La condición del inventario debe ser igual o mejor que la mínima pedida.
 * - Foil e idioma solo filtran si el comprador los especificó.
 */

export type FoilPreference = "yes" | "no" | "any";

export type WantItem = {
  id: string;
  oracleId: string;
  /** ID de Scryfall de una impresión específica, o null si cualquiera sirve. */
  printingId: string | null;
  quantity: number;
  minCondition: Condition;
  foil: FoilPreference;
  /** Código de idioma de Scryfall, o null si cualquiera sirve. */
  language: string | null;
};

export type InventoryItem = {
  id: string;
  storeId: string;
  oracleId: string;
  printingId: string;
  condition: Condition;
  language: string;
  foil: boolean;
  quantity: number;
  priceMxnCents: number;
};

export type Allocation = {
  wantItemId: string;
  inventoryItemId: string;
  storeId: string;
  quantity: number;
  unitPriceMxnCents: number;
};

export type MatchResult = {
  storeIds: string[];
  requestedQuantity: number;
  coveredQuantity: number;
  /** Fracción de la lista cubierta, de 0 a 1, contando copias. */
  coverage: number;
  totalMxnCents: number;
  allocations: Allocation[];
  missing: { wantItemId: string; quantity: number }[];
};

export function matchesWant(want: WantItem, item: InventoryItem): boolean {
  if (item.quantity <= 0) return false;
  if (want.printingId !== null ? item.printingId !== want.printingId : item.oracleId !== want.oracleId) {
    return false;
  }
  if (!meetsMinimum(item.condition, want.minCondition)) return false;
  if (want.foil === "yes" && !item.foil) return false;
  if (want.foil === "no" && item.foil) return false;
  if (want.language !== null && item.language !== want.language) return false;
  return true;
}

/**
 * Reparte la want list sobre un inventario tomando siempre las copias más
 * baratas. Los items que piden una impresión específica van primero, para que
 * los que aceptan cualquier impresión no les ganen las únicas copias que sirven.
 */
export function allocate(want: WantItem[], inventory: InventoryItem[]): MatchResult {
  const byOracle = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const list = byOracle.get(item.oracleId) ?? [];
    list.push(item);
    byOracle.set(item.oracleId, list);
  }
  for (const list of byOracle.values()) {
    list.sort((a, b) => a.priceMxnCents - b.priceMxnCents);
  }

  const remaining = new Map(inventory.map((item) => [item.id, item.quantity]));
  const ordered = [...want].sort(
    (a, b) => Number(a.printingId === null) - Number(b.printingId === null),
  );

  const allocations: Allocation[] = [];
  const missing: MatchResult["missing"] = [];
  let coveredQuantity = 0;
  let totalMxnCents = 0;

  for (const wantItem of ordered) {
    let needed = wantItem.quantity;
    for (const item of byOracle.get(wantItem.oracleId) ?? []) {
      if (needed === 0) break;
      const available = remaining.get(item.id) ?? 0;
      if (available === 0 || !matchesWant(wantItem, item)) continue;
      const taken = Math.min(needed, available);
      remaining.set(item.id, available - taken);
      needed -= taken;
      coveredQuantity += taken;
      totalMxnCents += taken * item.priceMxnCents;
      allocations.push({
        wantItemId: wantItem.id,
        inventoryItemId: item.id,
        storeId: item.storeId,
        quantity: taken,
        unitPriceMxnCents: item.priceMxnCents,
      });
    }
    if (needed > 0) missing.push({ wantItemId: wantItem.id, quantity: needed });
  }

  const requestedQuantity = want.reduce((sum, w) => sum + w.quantity, 0);
  return {
    storeIds: [...new Set(inventory.map((item) => item.storeId))].sort(),
    requestedQuantity,
    coveredQuantity,
    coverage: requestedQuantity === 0 ? 0 : coveredQuantity / requestedQuantity,
    totalMxnCents,
    allocations,
    missing,
  };
}

/** Resultado de cada tienda por separado, de mayor a menor cobertura. */
export function matchByStore(want: WantItem[], inventory: InventoryItem[]): MatchResult[] {
  return [...groupByStore(inventory).entries()]
    .map(([, items]) => allocate(want, items))
    .filter((result) => result.coveredQuantity > 0)
    .sort(compareResults);
}

/**
 * Combinaciones de hasta `maxStores` tiendas que cubren más de la lista al
 * menor costo. Con empate en cobertura y costo gana la que usa menos tiendas.
 *
 * Prueba todas las combinaciones de las tiendas que cubren algo: con las
 * decenas de tiendas del piloto son pocos miles de casos.
 */
export function bestCombinations(
  want: WantItem[],
  inventory: InventoryItem[],
  { maxStores = 3, limit = 5 }: { maxStores?: number; limit?: number } = {},
): MatchResult[] {
  const byStore = groupByStore(inventory);
  const useful = matchByStore(want, inventory).map((result) => result.storeIds[0]);

  const results: MatchResult[] = [];
  for (let size = 1; size <= Math.min(maxStores, useful.length); size++) {
    for (const combo of combinations(useful, size)) {
      const pooled = combo.flatMap((storeId) => byStore.get(storeId) ?? []);
      const result = allocate(want, pooled);
      // Si alguna tienda no aporta ninguna carta, la combinación más chica ya la cubre.
      const used = new Set(result.allocations.map((a) => a.storeId));
      if (used.size < combo.length) continue;
      results.push(result);
    }
  }
  return results.sort(compareResults).slice(0, limit);
}

function compareResults(a: MatchResult, b: MatchResult): number {
  return (
    b.coveredQuantity - a.coveredQuantity ||
    a.totalMxnCents - b.totalMxnCents ||
    a.storeIds.length - b.storeIds.length
  );
}

function groupByStore(inventory: InventoryItem[]): Map<string, InventoryItem[]> {
  const byStore = new Map<string, InventoryItem[]>();
  for (const item of inventory) {
    const list = byStore.get(item.storeId) ?? [];
    list.push(item);
    byStore.set(item.storeId, list);
  }
  return byStore;
}

function* combinations<T>(items: T[], size: number, start = 0): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = start; i <= items.length - size; i++) {
    for (const rest of combinations(items, size - 1, i + 1)) {
      yield [items[i], ...rest];
    }
  }
}
