import { ui } from "@/app/ui";
import { daysAgoLabel, isInventoryStale } from "@/lib/pricing/mxn";

/** Insignia de verificación y "inventario actualizado hace X días" (ámbar a los 30). */
export function SellerBadges({ isStore, verified, inventoryUpdatedAt }: { isStore: boolean; verified: boolean; inventoryUpdatedAt: string | null }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {isStore ? (
        <span className={verified ? ui.badgeAccent : ui.badge}>{verified ? "✓ Tienda verificada" : "Tienda sin verificar"}</span>
      ) : (
        <span className={ui.badge}>Vendedor</span>
      )}
      {inventoryUpdatedAt ? (
        <span className={isInventoryStale(inventoryUpdatedAt) ? ui.badgeWarn : ui.badge}>
          Inventario actualizado {daysAgoLabel(inventoryUpdatedAt)}
        </span>
      ) : (
        <span className={ui.badge}>Sin inventario cargado</span>
      )}
    </div>
  );
}
