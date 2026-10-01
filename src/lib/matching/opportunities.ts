import { allocate, type InventoryItem, type MatchResult, type WantItem } from "./match";

/**
 * Bandeja del vendedor: qué listas públicas puede surtir con su inventario. Usa
 * el mismo reparto que ve el comprador, con el inventario de un solo vendedor.
 */

export type OpportunityList = { id: string; items: WantItem[] };

export type Opportunity = { listId: string; result: MatchResult };

/** Listas que el inventario cubre al menos en parte, de mayor a menor cobertura y, a igual cobertura, de mayor monto. */
export function rankOpportunities(lists: OpportunityList[], inventory: InventoryItem[]): Opportunity[] {
  return lists
    .map((list) => ({ listId: list.id, result: allocate(list.items, inventory) }))
    .filter((o) => o.result.coveredQuantity > 0)
    .sort((a, b) => b.result.coverage - a.result.coverage || b.result.totalMxnCents - a.result.totalMxnCents);
}
