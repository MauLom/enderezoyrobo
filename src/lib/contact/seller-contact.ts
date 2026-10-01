/**
 * WhatsApp que se muestra de un vendedor (decisión B en docs/06): el de una
 * tienda es público; el de un particular solo aparece si quien mira tiene una
 * oferta aceptada con él.
 */
export function sellerWhatsapp(
  seller: { id: string; isStore: boolean; storeWhatsapp: string | null },
  dealContacts: ReadonlyMap<string, string>,
): string | null {
  if (seller.isStore) return seller.storeWhatsapp;
  return dealContacts.get(seller.id) ?? null;
}

/** Texto en lugar del botón cuando no hay WhatsApp. */
export function noContactLabel(isStore: boolean): string {
  return isStore ? "Sin WhatsApp" : "Al aceptar oferta";
}
