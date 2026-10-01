import type { Metadata } from "next";
import { PageHeader } from "@/app/_components/page-header";
import { requireProfile } from "@/supabase/session";
import { NewListForm } from "./new-list-form";

export const metadata: Metadata = { title: "Nueva want list · Mazo" };

export default async function NuevaListaPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        eyebrow="NUEVA WANT LIST"
        title="Pega tu lista."
        description="Te decimos qué tiendas y vendedores de Monterrey la tienen, y a qué precio."
      />
      <NewListForm />
    </>
  );
}
