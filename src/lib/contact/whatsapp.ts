/**
 * Enlaces de WhatsApp (wa.me) con mensaje prellenado. El trato se cierra por
 * WhatsApp; la plataforma solo arma el mensaje.
 */

/**
 * Número en formato internacional sin "+" ni espacios, como lo pide wa.me.
 * Un número mexicano de 10 dígitos recibe el 52; el "1" viejo de celulares
 * (521...) se quita. Devuelve null si no parece un teléfono.
 */
export function whatsappNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.length === 13 && digits.startsWith("521")) digits = `52${digits.slice(3)}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export function whatsappLink(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export type OrderLine = { quantity: number; name: string; detail?: string; unitPriceMxn?: string };

/** Mensaje para pedir cartas a una tienda. */
export function orderMessage(storeName: string, lines: OrderLine[], total?: string): string {
  const body = lines
    .map((l) => `• ${l.quantity}x ${l.name}${l.detail ? ` (${l.detail})` : ""}${l.unitPriceMxn ? ` – ${l.unitPriceMxn} c/u` : ""}`)
    .join("\n");
  return [
    `Hola, ${storeName}. Vi en Mazo que tienen estas cartas:`,
    body,
    total ? `Total: ${total}` : null,
    "¿Siguen disponibles?",
  ]
    .filter(Boolean)
    .join("\n\n");
}
