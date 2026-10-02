"use client";

import { useState } from "react";
import { ListingCard } from "@/app/_components/listing-card";
import { OffersModal } from "@/app/_components/offers-modal";
import type { CardListing } from "@/lib/marketplace/listings";

/** Las cartas de una tienda con el mismo grid y modal del marketplace. */
export function StoreInventory({ listings }: { listings: CardListing[] }) {
  const [selected, setSelected] = useState<CardListing | null>(null);
  return (
    <>
      <div className="card-grid">
        {listings.map((card) => (
          <ListingCard key={card.oracleId} card={card} onSelect={setSelected} />
        ))}
      </div>
      {selected && <OffersModal listing={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
