"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/app/_components/icon";
import { OffersModal } from "@/app/_components/offers-modal";
import { type CardListing, summarizeWishlist, type WantedCard } from "@/lib/marketplace/listings";
import { daysAgoLabel, formatMxn } from "@/lib/pricing/mxn";
import type { WantListSummary } from "@/supabase/want-lists";

/**
 * Resumen de una lista: cada carta con cuántas ofertas hay y el mejor precio.
 * No aplica condición mínima ni foil; eso lo hace el matching en /listas/<id>.
 */
export function ListPreview({ list, wanted, listings }: { list: WantListSummary; wanted: WantedCard[]; listings: CardListing[] }) {
  const [selected, setSelected] = useState<CardListing | null>(null);
  const cards = useMemo(() => summarizeWishlist(wanted, listings), [wanted, listings]);
  const available = cards.filter((c) => c.offerCount > 0).length;

  return (
    <section className="list-detail">
      <div className="list-detail-head">
        <div>
          <h2>{list.name}</h2>
          <span>
            {available} de {cards.length} {cards.length === 1 ? "carta disponible" : "cartas disponibles"} · actualizada{" "}
            {daysAgoLabel(list.updatedAt)}
          </span>
        </div>
        <Link href={`/listas/${list.id}`} className="publish-button">
          Comparar tiendas <Icon name="chevron" size={16} />
        </Link>
      </div>
      <div className="list-rows">
        {cards.map((card) => (
          <button
            type="button"
            key={card.oracleId}
            className="list-row"
            disabled={card.offerCount === 0}
            onClick={() => setSelected(listings.find((l) => l.oracleId === card.oracleId) ?? null)}
          >
            <span className="list-qty">{card.quantity}×</span>
            <span className="list-name">
              <strong>{card.name}</strong>
              {card.setCode && <small>{card.setCode.toUpperCase()}</small>}
            </span>
            <span className="list-offers">
              {card.offerCount === 0 ? "sin ofertas" : card.offerCount === 1 ? "1 oferta" : `${card.offerCount} ofertas`}
            </span>
            <span className="list-price">{card.bestPriceMxnCents !== null ? formatMxn(card.bestPriceMxnCents) : "—"}</span>
          </button>
        ))}
      </div>
      {selected && <OffersModal listing={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
