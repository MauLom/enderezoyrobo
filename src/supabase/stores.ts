import "server-only";
import { storeStatus, type StoreStatus } from "@/lib/account/store";
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
