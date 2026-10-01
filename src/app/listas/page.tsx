import type { Metadata } from "next";
import Link from "next/link";
import { ui } from "@/app/ui";
import { daysAgoLabel } from "@/lib/pricing/mxn";
import { requireProfile } from "@/supabase/session";
import { getMyWantLists } from "@/supabase/want-lists";

export const metadata: Metadata = { title: "Mis listas · Mazo" };

export default async function ListasPage() {
  const profile = await requireProfile();
  const lists = await getMyWantLists(profile.id);

  return (
    <main className={ui.page}>
      <div className="flex items-center justify-between gap-4">
        <h1 className={ui.h1}>Mis listas</h1>
        <Link href="/listas/nueva" className={ui.button}>
          Nueva lista
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-start gap-3`}>
          <p>Todavía no tienes listas.</p>
          <p className={ui.muted}>
            Pega las cartas que buscas y te mostramos qué tiendas las tienen, a qué precio y cuál es la combinación más
            barata.
          </p>
          <Link href="/listas/nueva" className={ui.link}>
            Crear mi primera lista
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lists.map((list) => (
            <li key={list.id}>
              <Link href={`/listas/${list.id}`} className={`${ui.card} flex items-center justify-between gap-4 hover:border-foreground/40`}>
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className={ui.muted}>
                    {list.cardCount} cartas · actualizada {daysAgoLabel(list.updatedAt)}
                  </p>
                </div>
                <span className={ui.badge}>{list.isPublic ? "Pública" : "Privada"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
