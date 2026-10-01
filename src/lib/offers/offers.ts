import type { Validated } from "@/lib/account/validation";
import { allocate, type InventoryItem, type MatchResult, type WantItem } from "@/lib/matching/match";
import { parseMxnCents } from "@/lib/pricing/mxn";

/**
 * Ofertas por el lote de una lista pública. El trato se cierra fuera de la
 * plataforma; aquí solo se arma, valida y cambia de estado la oferta.
 */

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export const STATUS_LABEL: Record<OfferStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  withdrawn: "Retirada",
};

export type OfferActor = "owner" | "seller";

/**
 * Cambios de estado permitidos: el dueño de la lista acepta o rechaza, el
 * vendedor retira, y solo mientras está pendiente. Es la misma regla que el
 * trigger offer_guard en la base.
 */
export function canChangeStatus(from: OfferStatus, to: OfferStatus, actor: OfferActor): boolean {
  if (from !== "pending") return false;
  return actor === "owner" ? to === "accepted" || to === "rejected" : to === "withdrawn";
}

/** Papel del usuario en una oferta: dueño de la lista o vendedor; null si no participa. */
export function offerActor(offer: { sellerId: string; ownerId: string }, userId: string): OfferActor | null {
  if (offer.ownerId === userId) return "owner";
  if (offer.sellerId === userId) return "seller";
  return null;
}

/** Mensaje para escribirle por WhatsApp a la otra parte de una oferta aceptada. */
export function dealMessage(myName: string, listName: string, total: string): string {
  return `Hola, soy ${myName} de Mazo. Te escribo por la oferta aceptada de ${total} por la lista "${listName}".`;
}

// Borrador ------------------------------------------------------------------------

export type DraftLine = {
  wantItemId: string;
  requested: number;
  /** Copias que el inventario del vendedor cubre. */
  quantity: number;
  /** Precio de cada copia cubierta, de la más barata a la más cara. */
  unitPricesMxnCents: number[];
};

/** Propuesta inicial de oferta: lo que el inventario del vendedor cubre, a sus precios. */
export function draftOffer(want: WantItem[], inventory: InventoryItem[]): { lines: DraftLine[]; result: MatchResult } {
  const result = allocate(want, inventory);
  const lines = want.map((w) => {
    const prices = result.allocations
      .filter((a) => a.wantItemId === w.id)
      .flatMap((a) => Array<number>(a.quantity).fill(a.unitPriceMxnCents))
      .sort((a, b) => a - b);
    return { wantItemId: w.id, requested: w.quantity, quantity: prices.length, unitPricesMxnCents: prices };
  });
  return { lines, result };
}

/** Total a precios del inventario para las cantidades elegidas; las copias sin precio no suman. */
export function draftTotal(lines: DraftLine[], quantities: Record<string, number>): number {
  return lines.reduce((sum, line) => {
    const q = Math.min(quantities[line.wantItemId] ?? 0, line.unitPricesMxnCents.length);
    return sum + line.unitPricesMxnCents.slice(0, q).reduce((s, p) => s + p, 0);
  }, 0);
}

// Formulario -----------------------------------------------------------------------

export const MAX_OFFER_MESSAGE = 500;

export type OfferInput = {
  totalMxnCents: number;
  message: string | null;
  items: { wantListItemId: string; quantity: number }[];
};

export type OfferForm = {
  total: string;
  message: string;
  /** Cantidad por id de item de la want list, como viene del formulario. */
  quantities: Record<string, string>;
};

/** Valida la oferta contra las cartas de la lista (id y cantidad pedida). */
export function parseOfferForm(form: OfferForm, wantItems: { id: string; quantity: number }[]): Validated<OfferInput> {
  const items: OfferInput["items"] = [];
  for (const want of wantItems) {
    const raw = (form.quantities[want.id] ?? "").trim();
    if (raw === "" || raw === "0") continue;
    if (!/^\d+$/.test(raw)) return { ok: false, error: "Las cantidades deben ser números enteros." };
    const quantity = Number(raw);
    if (quantity > want.quantity) return { ok: false, error: "No puedes ofrecer más copias de las que pide la lista." };
    items.push({ wantListItemId: want.id, quantity });
  }
  if (items.length === 0) return { ok: false, error: "Elige al menos una carta." };

  const total = parseMxnCents(form.total);
  if (total === null || total === 0) return { ok: false, error: "Escribe el total de la oferta en pesos." };

  const message = form.message.trim();
  if (message.length > MAX_OFFER_MESSAGE) {
    return { ok: false, error: `El mensaje puede tener hasta ${MAX_OFFER_MESSAGE} caracteres.` };
  }
  return { ok: true, value: { totalMxnCents: total, message: message || null, items } };
}

// Calificaciones --------------------------------------------------------------------

export const MAX_RATING_COMMENT = 300;

export function parseRating(rawScore: string, rawComment: string): Validated<{ score: number; comment: string | null }> {
  const score = Number(rawScore);
  if (!Number.isInteger(score) || score < 1 || score > 5) return { ok: false, error: "Elige de 1 a 5 estrellas." };
  const comment = rawComment.trim();
  if (comment.length > MAX_RATING_COMMENT) {
    return { ok: false, error: `El comentario puede tener hasta ${MAX_RATING_COMMENT} caracteres.` };
  }
  return { ok: true, value: { score, comment: comment || null } };
}

/** "★ 4.5 (2)"; null si no hay calificaciones. */
export function ratingLabel(scores: number[]): string | null {
  if (scores.length === 0) return null;
  const average = scores.reduce((s, x) => s + x, 0) / scores.length;
  return `★ ${average.toFixed(1)} (${scores.length})`;
}
