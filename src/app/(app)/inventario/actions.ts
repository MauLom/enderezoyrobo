"use server";

import { revalidatePath } from "next/cache";
import { inventoryLimitError } from "@/lib/catalog/resolve-inventory";
import type { InventoryIssue } from "@/lib/import/store-inventory";
import { formatMxn } from "@/lib/pricing/mxn";
import { replaceInventory, resolveInventoryCsv } from "@/supabase/my-inventory";
import { requireProfile } from "@/supabase/session";

// Unas 8,000 filas de la plantilla.
const MAX_CSV_TEXT = 500_000;
// La vista previa muestra hasta estas cartas; los conteos son del archivo completo.
const PREVIEW_LIMIT = 200;

export type InventoryPreviewItem = {
  key: string;
  name: string;
  detail: string;
  quantity: number;
  price: string;
  imageUri: string | null;
};

export type InventoryState = {
  text: string;
  fileName?: string;
  preview?: {
    items: InventoryPreviewItem[];
    distinct: number;
    copies: number;
    errors: InventoryIssue[];
    warnings: InventoryIssue[];
  };
  error?: string;
  /** Renglones guardados tras confirmar. */
  saved?: number;
};

/** Paso 1 (`intent=review`): vista previa. Paso 2 (`intent=save`): reemplaza el inventario. */
export async function inventoryAction(_prev: InventoryState, formData: FormData): Promise<InventoryState> {
  const profile = await requireProfile();
  const text = String(formData.get("text") ?? "");
  const fileName = String(formData.get("fileName") ?? "") || undefined;
  if (profile.kind === "player") return { text, error: "Cambia tu cuenta a vendedor en Mi cuenta para cargar inventario." };
  if (!text.trim()) return { text, fileName, error: "Sube el CSV de tu inventario o pégalo en la caja." };
  if (text.length > MAX_CSV_TEXT) return { text: "", error: "El archivo es demasiado grande. Divide el inventario o escríbenos." };

  // En los dos pasos se vuelve a resolver en el servidor: no se confía en la vista previa del navegador.
  const resolved = await resolveInventoryCsv(text);
  const limit = inventoryLimitError(profile.kind, resolved.items);
  const errors = limit ? [{ rowNumber: null, message: limit }, ...resolved.errors] : resolved.errors;

  if (formData.get("intent") === "save") {
    if (errors.length > 0) return { text, fileName, error: "Corrige los errores del archivo antes de guardar: no guardamos nada a medias." };
    if (resolved.items.length === 0) return { text, fileName, error: "El archivo no trae ninguna carta con existencias." };
    try {
      const saved = await replaceInventory(resolved.items);
      revalidatePath("/", "layout");
      return { text: "", saved };
    } catch {
      return { text, fileName, error: "No pudimos guardar el inventario. No se cambió nada; intenta de nuevo." };
    }
  }

  return {
    text,
    fileName,
    preview: {
      items: resolved.items.slice(0, PREVIEW_LIMIT).map((item) => ({
        key: item.key,
        name: item.printing.name,
        detail: [
          `${item.printing.setCode.toUpperCase()} ${item.printing.collectorNumber}`,
          item.condition,
          item.language !== "en" ? item.language.toUpperCase() : null,
          item.foil ? "foil" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        quantity: item.quantity,
        price: formatMxn(item.priceMxnCents),
        imageUri: item.printing.imageUri,
      })),
      distinct: resolved.items.length,
      copies: resolved.items.reduce((sum, i) => sum + i.quantity, 0),
      errors,
      warnings: resolved.warnings,
    },
  };
}
