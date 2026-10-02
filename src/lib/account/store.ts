/**
 * Registro de tienda (#6) y su revisión por owners y moderadores. Los límites
 * coinciden con los checks de la tabla store y store_rejection.
 */
import { type Validated, validateWhatsapp } from "./validation";

export const STORE_NAME_MAX = 60;
export const STORE_ADDRESS_MAX = 160;
export const STORE_PRICE_NOTE_MAX = 60;
export const REJECTION_REASON_MAX = 500;

export type StoreInput = {
  name: string;
  address: string;
  whatsapp: string;
  /** Referencia de precio declarada, p. ej. "SCG −10 %". Opcional. */
  priceReferenceNote: string | null;
};

const clean = (raw: string) => raw.trim().replace(/\s+/g, " ");

/** Nombre, dirección y WhatsApp son obligatorios: la verificación revisa la tienda física y su contacto. */
export function validateStore(raw: Record<keyof StoreInput, string>): Validated<StoreInput> {
  const name = clean(raw.name);
  if (name.length < 2) return { ok: false, error: "El nombre de la tienda debe tener al menos 2 caracteres." };
  if (name.length > STORE_NAME_MAX) return { ok: false, error: `El nombre puede tener hasta ${STORE_NAME_MAX} caracteres.` };

  const address = clean(raw.address);
  if (address.length < 5) return { ok: false, error: "Escribe la dirección de la tienda (calle, número y colonia)." };
  if (address.length > STORE_ADDRESS_MAX) {
    return { ok: false, error: `La dirección puede tener hasta ${STORE_ADDRESS_MAX} caracteres.` };
  }

  const whatsapp = validateWhatsapp(raw.whatsapp);
  if (!whatsapp.ok) return whatsapp;
  if (!whatsapp.value) return { ok: false, error: "La tienda necesita un WhatsApp: es como la contactan los jugadores." };

  const note = clean(raw.priceReferenceNote);
  if (note.length > STORE_PRICE_NOTE_MAX) {
    return { ok: false, error: `La referencia de precio puede tener hasta ${STORE_PRICE_NOTE_MAX} caracteres.` };
  }

  return { ok: true, value: { name, address, whatsapp: whatsapp.value, priceReferenceNote: note || null } };
}

export function validateRejectionReason(raw: string): Validated<string> {
  const reason = raw.trim();
  if (reason.length < 3) return { ok: false, error: "Escribe el motivo: la tienda lo verá en su cuenta." };
  if (reason.length > REJECTION_REASON_MAX) {
    return { ok: false, error: `El motivo puede tener hasta ${REJECTION_REASON_MAX} caracteres.` };
  }
  return { ok: true, value: reason };
}

export type StoreStatus = "pending" | "verified" | "rejected";

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  pending: "Pendiente de verificación",
  verified: "Verificada",
  rejected: "Rechazada",
};

/** Verificada si tiene fecha de verificación; rechazada si tiene rechazo; si no, pendiente. */
export function storeStatus(store: { verifiedAt: string | null; rejectedAt: string | null }): StoreStatus {
  if (store.verifiedAt) return "verified";
  if (store.rejectedAt) return "rejected";
  return "pending";
}
