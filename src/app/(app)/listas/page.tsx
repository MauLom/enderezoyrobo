import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { getMarketplace } from "@/supabase/marketplace";
import { requireProfile } from "@/supabase/session";
import { getMyWantLists } from "@/supabase/want-lists";
import { ListPreview } from "./list-preview";

export const metadata: Metadata = { title: "Mis listas · Mazo" };

export default async function ListasPage({ searchParams }: PageProps<"/listas">) {
  const profile = await requireProfile();
  const { lista } = await searchParams;
  const [lists, { listings, wanted }] = await Promise.all([
    getMyWantLists(profile.id),
    getMarketplace(profile.id, { recent: false }),
  ]);
  const selected = lists.find((l) => l.id === lista) ?? lists[0] ?? null;

  return (
    <>
      <PageHeader eyebrow="MIS LISTAS" title="Tus want lists." description="Las cartas que buscas y quién las tiene hoy en Monterrey.">
        <Link href="/listas/nueva" className="publish-button"><Icon name="plus" size={18} /> Nueva want list</Link>
      </PageHeader>

      {lists.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no tienes listas. Pega las cartas que buscas y te mostramos qué tiendas las tienen y a qué precio.</p>
          <Link href="/listas/nueva" className="text-button">Armar mi primera want list <Icon name="chevron" size={14} /></Link>
        </div>
      ) : (
        <div className="lists-layout">
          <nav className="lists-column" aria-label="Tus listas">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/listas?lista=${list.id}`}
                scroll={false}
                className={`list-card ${list.id === selected?.id ? "active" : ""}`}
                aria-current={list.id === selected?.id ? "page" : undefined}
              >
                <strong>{list.name}</strong>
                <span>
                  {list.cardCount === 1 ? "1 carta" : `${list.cardCount} cartas`} · {list.isPublic ? "pública" : "privada"}
                </span>
              </Link>
            ))}
          </nav>
          {selected && (
            <ListPreview
              list={selected}
              wanted={wanted.filter((w) => w.listId === selected.id)}
              listings={listings}
            />
          )}
        </div>
      )}
    </>
  );
}
