"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/app/_components/icon";
import { ListingCard } from "@/app/_components/listing-card";
import { OffersModal } from "@/app/_components/offers-modal";
import { PageHeader } from "@/app/_components/page-header";
import { type CardListing, searchListings, summarizeWishlist, type WantedCard } from "@/lib/marketplace/listings";
import { formatMxn } from "@/lib/pricing/mxn";

type Filter = "Todo" | "Mi wishlist";

export type DashboardProps = {
  firstName: string;
  listings: CardListing[];
  wanted: WantedCard[];
};

export function DashboardApp({ firstName, listings, wanted }: DashboardProps) {
  // La búsqueda vive en la barra superior (AppShell) y llega por ?q=.
  const search = useSearchParams().get("q") ?? "";
  const [filter, setFilter] = useState<Filter>("Todo");
  const [selected, setSelected] = useState<CardListing | null>(null);

  const wishlist = useMemo(() => summarizeWishlist(wanted, listings), [wanted, listings]);
  const available = wishlist.filter((c) => c.offerCount > 0).length;
  const base = filter === "Todo" ? listings : listings.filter((l) => l.wanted);
  const visible = searchListings(base, search);

  return (
    <>
      <PageHeader
        eyebrow="MARKETPLACE LOCAL"
        title={`Hola, ${firstName}.`}
        description="Cartas que tienen hoy las tiendas y vendedores de Monterrey."
      />
      <section className="toolbar">
        <div className="filters">
          {(["Todo", "Mi wishlist"] as const).map((f) => (
            <button type="button" key={f} className={filter === f ? "filter active" : "filter"} onClick={() => setFilter(f)}>
              {f === "Mi wishlist" && <Icon name="heart" size={15} />}
              {f}
            </button>
          ))}
        </div>
      </section>
      <section className="listing-section">
        <div className="section-heading">
          <div>
            <h2>{filter === "Todo" ? "Disponibles" : "De tus listas"}</h2>
            <span>
              {visible.length === 1 ? "1 carta" : `${visible.length} cartas`}
              {filter === "Todo" && wishlist.length > 0 ? " · primero las que buscas" : ""}
            </span>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="empty-state">
            {search.trim().length >= 2 ? (
              <p>Nadie tiene «{search.trim()}» por ahora.</p>
            ) : filter === "Mi wishlist" ? (
              <>
                <p>Ninguna carta de tus listas está disponible todavía.</p>
                <Link href="/listas/nueva" className="text-button">Armar una want list <Icon name="chevron" size={14} /></Link>
              </>
            ) : (
              <p>Todavía no hay inventario cargado.</p>
            )}
          </div>
        ) : (
          <div className="card-grid">
            {visible.map((card) => (
              <ListingCard key={card.oracleId} card={card} onSelect={setSelected} />
            ))}
          </div>
        )}
      </section>

      <aside className="right-rail">
        <div className="rail-heading">
          <div><span className="rail-icon"><Icon name="heart" size={17} /></span><h2>Tu wishlist</h2></div>
          <Link href="/listas" className="rail-link">Ver todo</Link>
        </div>
        {wishlist.length === 0 ? (
          <>
            <p className="rail-copy">Todavía no tienes want lists.</p>
            <Link href="/listas/nueva" className="manage-button"><Icon name="plus" size={16} /> Armar mi want list</Link>
          </>
        ) : (
          <>
            <p className="rail-copy">
              {available === 0
                ? "Ninguna de tus cartas está disponible todavía"
                : `${available} de ${wishlist.length} ${wishlist.length === 1 ? "carta está disponible" : "cartas están disponibles"}`}
            </p>
            <div className="wishlist-list">
              {wishlist.slice(0, 8).map((card, index) => (
                <button
                  type="button"
                  className="wishlist-item"
                  key={card.oracleId}
                  disabled={card.offerCount === 0}
                  onClick={() => setSelected(card.listing)}
                >
                  <div className={`wish-thumb wish-${index % 3}`}><Icon name="spark" size={17} /></div>
                  <div className="wish-name">
                    <strong>{card.name}</strong>
                    <span>
                      {card.setCode ? `${card.setCode.toUpperCase()} · ` : ""}
                      {card.offerCount === 0 ? "sin ofertas" : card.offerCount === 1 ? "1 oferta" : `${card.offerCount} ofertas`}
                    </span>
                  </div>
                  <div className="wish-price">
                    {card.bestPriceMxnCents !== null ? (
                      <><strong>{formatMxn(card.bestPriceMxnCents)}</strong><span>MXN</span></>
                    ) : (
                      <span>×{card.quantity}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Link href="/listas" className="manage-button"><Icon name="heart" size={16} /> Administrar mis listas</Link>
          </>
        )}
      </aside>

      {selected && <OffersModal listing={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
