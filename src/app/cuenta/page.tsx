import type { Metadata } from "next";
import { requireProfile } from "@/supabase/session";
import { signOut } from "./actions";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta · Mazo" };

export default async function CuentaPage() {
  const profile = await requireProfile();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        {profile.email && <p className="text-sm opacity-70">{profile.email}</p>}
      </div>
      <ProfileForm displayName={profile.displayName} />
      <form action={signOut}>
        <button type="submit" className="text-sm underline opacity-70">
          Salir
        </button>
      </form>
    </main>
  );
}
