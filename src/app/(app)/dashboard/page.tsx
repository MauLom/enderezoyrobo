import type { Metadata } from "next";
import { getMarketplace } from "@/supabase/marketplace";
import { requireProfile } from "@/supabase/session";
import { DashboardApp } from "./dashboard-app";

export const metadata: Metadata = { title: "Marketplace · Mazo" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const { listings, wanted } = await getMarketplace(profile.id);

  return <DashboardApp firstName={profile.displayName.split(/\s+/)[0]} listings={listings} wanted={wanted} />;
}
