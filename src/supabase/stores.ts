import "server-only";
import { storeStatus, type StoreStatus } from "@/lib/account/store";
import { type CardListing, groupListings } from "@/lib/marketplace/listings";
import { OFFER_COLUMNS, toMarketOffer } from "./marketplace";
import { createClient } from "./server";

export type MyStore = {
  id: string;
  name: string;
  address: string;
  whatsapp: string;
  priceReferenceNote: string | null;
  status: StoreStatus;
  /** Motivo del rechazo vigente; solo lo ven la tienda y el staff (RLS). */
  rejectionReason: string | null;
};

/** Tienda del usuario con su estado de revisión, o null si no ha registrado una. */
export async function getMyStore(profileId: string): Promise<MyStore | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store")
    .select("id, name, address, whatsapp, price_reference_note, verified_at, store_rejection(reason, rejected_at)")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    address: data.address ?? "",
    whatsapp: data.whatsapp ?? "",
    priceReferenceNote: data.price_reference_note,
    status: storeStatus({ verifiedAt: data.verified_at, rejectedAt: data.store_rejection?.rejected_at ?? null }),
    rejectionReason: data.store_rejection?.reason ?? null,
  };
}

export type StoreForReview = {
  id: string;
  name: string;
  address: string | null;
  whatsapp: string | null;
  priceReferenceNote: string | null;
  createdAt: string;
  status: StoreStatus;
  rejectionReason: string | null;
  ownerName: string;
  ownerEmail: string;
  inventoryCount: number;
};

/** Todas las tiendas para /tiendas. La función falla si el usuario no es staff. */
export async function getStoresForReview(): Promise<StoreForReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tiendas_para_revisar");
  if (error) throw error;
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    whatsapp: s.whatsapp,
    priceReferenceNote: s.price_reference_note,
    createdAt: s.created_at,
    status: storeStatus({ verifiedAt: s.verified_at, rejectedAt: s.rejected_at }),
    rejectionReason: s.rejection_reason,
    ownerName: s.owner_name,
    ownerEmail: s.owner_email,
    inventoryCount: s.inventory_count,
  }));
}

/** Tiendas sin verificar ni rechazar, para el número del menú del staff. */
export async function countPendingStores(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("store").select("id, store_rejection(store_id)").is("verified_at", null);
  if (error) throw error;
  return data.filter((s) => !s.store_rejection).length;
}

export type PublicStore = {
  sellerId: string;
  name: string;
  address: string | null;
  whatsapp: string | null;
  priceReferenceNote: string | null;
  verified: boolean;
  inventoryUpdatedAt: string | null;
  listings: CardListing[];
};

/**
 * Página pública de una tienda (/tiendas/<id>, con el id de su perfil): datos
 * de la tienda y su inventario agrupado por carta. Null si no existe. Todo es
 * de lectura pública, así que funciona sin sesión.
 */
export async function getPublicStore(sellerId: string): Promise<PublicStore | null> {
  const supabase = await createClient();
  const [store, inventory] = await Promise.all([
    supabase
      .from("store")
      .select("profile_id, name, address, whatsapp, price_reference_note, verified_at, inventory_updated_at")
      .eq("profile_id", sellerId)
      .maybeSingle(),
    supabase.from("inventory_item").select(OFFER_COLUMNS).eq("seller_id", sellerId).gt("quantity", 0),
  ]);
  if (store.error) throw store.error;
  if (inventory.error) throw inventory.error;
  if (!store.data) return null;

  // El WhatsApp de una tienda es público: no hacen falta los contactos de tratos.
  const offers = inventory.data.map((r) => toMarketOffer(r, new Map()));
  return {
    sellerId: store.data.profile_id,
    name: store.data.name,
    address: store.data.address,
    whatsapp: store.data.whatsapp,
    priceReferenceNote: store.data.price_reference_note,
    verified: store.data.verified_at !== null,
    inventoryUpdatedAt: store.data.inventory_updated_at,
    listings: groupListings(offers).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
