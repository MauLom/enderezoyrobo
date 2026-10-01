import type { Metadata } from "next";
import Link from "next/link";
import { ui } from "@/app/ui";
import { requireProfile } from "@/supabase/session";
import { NewListForm } from "./new-list-form";

export const metadata: Metadata = { title: "Nueva want list · Mazo" };

export default async function NuevaListaPage() {
  await requireProfile();

  return (
    <main className={ui.page}>
      <div className="flex flex-col gap-1">
        <Link href="/listas" className={`${ui.muted} ${ui.link}`}>
          ← Mis listas
        </Link>
        <h1 className={ui.h1}>Nueva want list</h1>
        <p className={ui.muted}>Pega tu lista y te decimos qué tiendas de Monterrey la tienen.</p>
      </div>
      <NewListForm />
    </main>
  );
}
