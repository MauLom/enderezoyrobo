import Image from "next/image";
import { type CardListing, initials, type MarketOffer } from "@/lib/marketplace/listings";
import { formatMxn } from "@/lib/pricing/mxn";
import { Icon } from "./icon";
import { accent } from "./offers-modal";

function sellerLabel(offer: MarketOffer): string {
  if (offer.location) return offer.location;
  if (offer.isStore) return offer.verified ? "Tienda verificada" : "Tienda";
  return "Vendedor";
}

/** Una carta del grid del marketplace: imagen, precio más bajo y quién la vende. */
export function ListingCard({ card, onSelect }: { card: CardListing; onSelect: (card: CardListing) => void }) {
  const best = card.offers[0];
  return (
    <article className="listing-card" onClick={() => onSelect(card)}>
      <div className="card-image-wrap">
        {card.imageUri ? (
          <Image src={card.imageUri} alt={card.name} width={488} height={680} />
        ) : (
          <div className="card-skeleton"><span>MAZO</span></div>
        )}
        <span className="condition">{card.condition}</span>
        {card.wanted && (
          <span className="heart-button saved" title="Está en tus listas">
            <Icon name="heart" size={18} />
          </span>
        )}
      </div>
      <div className="listing-info">
        <div className="set-line"><span>{card.setCode.toUpperCase()}</span>{card.setName}</div>
        <h3>{card.name}</h3>
        <div className="price">{formatMxn(card.bestPriceMxnCents)} <small>MXN desde</small></div>
        <div className="seller">
          <div className={`mini-avatar ${accent(best.sellerId)}`}>{initials(best.sellerName)}</div>
          <div>
            <strong>{best.sellerName}{card.sellerCount > 1 ? ` y ${card.sellerCount - 1} más` : ""}</strong>
            <span><Icon name="map" size={12} /> {sellerLabel(best)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
