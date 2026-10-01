/** Validación de los datos de cuenta que escribe el usuario. Devuelven el valor limpio o un mensaje de error. */

import { whatsappNumber } from "@/lib/contact/whatsapp";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateEmail(raw: string): Validated<string> {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Escribe un correo válido." };
  }
  return { ok: true, value: email };
}

/** Código de 6 dígitos del correo; tolera espacios o guiones al pegarlo. */
export function validateOtp(raw: string): Validated<string> {
  const code = raw.replace(/[\s-]/g, "");
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "El código tiene 6 dígitos." };
  }
  return { ok: true, value: code };
}

export const DISPLAY_NAME_MAX = 40;

export function validateDisplayName(raw: string): Validated<string> {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) return { ok: false, error: "El nombre debe tener al menos 2 caracteres." };
  if (name.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: `El nombre puede tener hasta ${DISPLAY_NAME_MAX} caracteres.` };
  }
  return { ok: true, value: name };
}

/** WhatsApp en formato internacional ("+5281…"). Vacío es válido y significa borrar el número. */
export function validateWhatsapp(raw: string): Validated<string | null> {
  if (raw.trim() === "") return { ok: true, value: null };
  const number = whatsappNumber(raw);
  if (!number) return { ok: false, error: "Escribe un número de 10 dígitos, p. ej. 81 1234 5678." };
  return { ok: true, value: `+${number}` };
}

/** Municipios del área metropolitana de Monterrey para la zona de entrega. */
export const DELIVERY_ZONES = [
  "Monterrey",
  "San Pedro Garza García",
  "San Nicolás de los Garza",
  "Guadalupe",
  "Apodaca",
  "General Escobedo",
  "Santa Catarina",
  "García",
  "Juárez",
  "Santiago",
  "Cadereyta Jiménez",
  "Salinas Victoria",
  "Pesquería",
] as const;

/** Zona de entrega: uno de DELIVERY_ZONES, o vacío para no indicar ninguna. */
export function validateDeliveryZone(raw: string): Validated<string | null> {
  const zone = raw.trim();
  if (zone === "") return { ok: true, value: null };
  if (!(DELIVERY_ZONES as readonly string[]).includes(zone)) return { ok: false, error: "Elige un municipio de la lista." };
  return { ok: true, value: zone };
}

/** Página de inicio con sesión: a donde se llega al entrar si no se pedía otra. */
export const HOME_PATH = "/dashboard";

/**
 * Ruta a la que volver después de entrar. Solo rutas internas ("/listas/…");
 * cualquier otra cosa ("//sitio.com", "https://…") manda a `fallback`.
 */
export function safeNextPath(raw: unknown, fallback = HOME_PATH): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}
