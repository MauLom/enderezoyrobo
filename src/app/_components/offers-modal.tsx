"use client";

import Image from "next/image";
import { noContactLabel } from "@/lib/contact/seller-contact";
import { orderMessage, whatsappLink } from "@/lib/contact/whatsapp";
import { type CardListing, initials, type MarketOffer } from "@/lib/marketplace/listings";
import { formatMxn } from "@/lib/pricing/mxn";
import { Icon } from "./icon";

const ACCENTS = ["violet", "orange", "blue", "rose", "teal", "green"] as const;

/** Color estable por vendedor. */
export function accent(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

export function offerDetail(offer: MarketOffer): string {
  return [offer.setCode.toUpperCase(), offer.condition, offer.foil ? "foil" : null, offer.language !== "en" ? offer.language.toUpperCase() : null]
    .filter(Boolean)
    .join(" · ");
}

/** Todas las ofertas de una carta, con WhatsApp de las tiendas y de los particulares con oferta aceptada. */
export function OffersModal({ listing, onClose }: { listing: CardListing; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal offers-modal" role="dialog" aria-modal="true" aria-label={listing.name} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><span>OFERTAS DISPONIBLES</span><h2>{listing.name}</h2></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={18} /></button>
        </div>
        <div className="offer-summary">
          {listing.imageUri && <Image src={listing.imageUri} alt={listing.name} width={488} height={680} />}
          <div>
            <span>Mejor precio desde</span>
            <strong>{formatMxn(listing.bestPriceMxnCents)} MXN</strong>
            <small>
              {listing.offers.length === 1 ? "1 oferta" : `${listing.offers.length} ofertas`} de{" "}
              {listing.sellerCount === 1 ? "1 vendedor" : `${listing.sellerCount} vendedores`}
            </small>
          </div>
        </div>
        <div className="offers-list">
          {listing.offers.map((offer) => {
            const link = offer.whatsapp
              ? whatsappLink(
                  offer.whatsapp,
                  orderMessage(offer.sellerName, [
                    { quantity: 1, name: offer.cardName, detail: offerDetail(offer), unitPriceMxn: formatMxn(offer.priceMxnCents) },
                  ]),
                )
              : null;
            return (
              <div className="offer-row" key={offer.id}>
                <div className={`activity-avatar ${accent(offer.sellerId)}`}>{initials(offer.sellerName)}</div>
                <div>
                  <strong>{offer.sellerName}{offer.verified ? " ✓" : ""}</strong>
                  <span>{offerDetail(offer)} · {offer.quantity} disp.{offer.location ? ` · ${offer.location}` : ""}</span>
                </div>
                <b>{formatMxn(offer.priceMxnCents)}</b>
                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                ) : (
                  <span
                    className="no-contact"
                    title={offer.isStore ? "Esta tienda no tiene WhatsApp registrado" : "El WhatsApp de un particular se comparte al aceptar una oferta"}
                  >
                    {noContactLabel(offer.isStore)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
