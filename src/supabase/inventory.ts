import type { Condition } from "@/lib/cards/condition";
import type { Database } from "./database.types";

/** Renglón de inventario con los datos del vendedor, como lo devuelven inventario_para y mi_inventario_para. */
export type InventoryRow = {
  id: string;
  sellerId: string;
  sellerName: string;
  isStore: boolean;
  verified: boolean;
  whatsapp: string | null;
  inventoryUpdatedAt: string;
  oracleId: string;
  printingId: string;
  cardName: string;
  setCode: string;
  collectorNumber: string;
  condition: Condition;
  language: string;
  foil: boolean;
  quantity: number;
  priceMxnCents: number;
};

type InventoryRpcRow = Database["public"]["Functions"]["inventario_para"]["Returns"][number];

export function toInventoryRow(r: InventoryRpcRow): InventoryRow {
  return {
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.store_name ?? r.seller_name,
    isStore: r.seller_kind === "store" && r.store_name !== null,
    verified: r.store_verified ?? false,
    whatsapp: r.store_whatsapp,
    inventoryUpdatedAt: r.inventory_updated_at,
    oracleId: r.oracle_id,
    printingId: r.printing_id,
    cardName: r.card_name,
    setCode: r.set_code,
    collectorNumber: r.collector_number,
    condition: r.condition,
    language: r.language,
    foil: r.foil,
    quantity: r.quantity,
    priceMxnCents: r.price_mxn_cents,
  };
}
