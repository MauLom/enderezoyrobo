import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { sellerWhatsapp } from "@/lib/contact/seller-contact";
import { whatsappLink } from "@/lib/contact/whatsapp";
import { dealMessage, type OfferActor, type OfferStatus, STATUS_LABEL } from "@/lib/offers/offers";
import { daysAgoLabel, formatMxn } from "@/lib/pricing/mxn";
import { getDealContacts, getMyWhatsapp } from "@/supabase/contacts";
import { getOfferInbox, type InboxOffer } from "@/supabase/offers";
import { type Profile, requireProfile } from "@/supabase/session";
import { RatingForm } from "./rating-form";
import { StatusButtons } from "./status-buttons";

export const metadata: Metadata = { title: "Ofertas · Mazo" };

const STATUS_BADGE: Record<OfferStatus, string> = {
  pending: ui.badgeWarn,
  accepted: ui.badgeAccent,
  rejected: ui.badge,
  withdrawn: ui.badge,
};

export default async function OfertasPage() {
  const profile = await requireProfile();
  const [{ received, sent }, contacts, myWhatsapp] = await Promise.all([
    getOfferInbox(profile.id),
    getDealContacts(),
    getMyWhatsapp(profile.id),
  ]);
  const pending = received.filter((o) => o.status === "pending").length;

  const card = (offer: InboxOffer, actor: OfferActor) => (
    <OfferCard key={offer.id} offer={offer} actor={actor} profile={profile} contacts={contacts} hasWhatsapp={myWhatsapp !== null} />
  );

  return (
    <>
      <PageHeader
        eyebrow="OFERTAS"
        title="Ofertas"
        description={
          pending > 0
            ? `${pending === 1 ? "Tienes 1 oferta" : `Tienes ${pending} ofertas`} por responder.`
            : "Las ofertas por tus listas públicas y las que haces como vendedor."
        }
      />
      <div className={ui.page}>
        <section className="flex flex-col gap-3">
          <div className="section-heading">
            <div>
              <h2>Recibidas</h2>
              <span>Ofertas por el lote de tus listas públicas</span>
            </div>
          </div>
          {received.length === 0 ? (
            <div className="empty-state">
              <p>Todavía no recibes ofertas. Haz pública una lista y comparte el enlace para que los vendedores te oferten.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">{received.map((o) => card(o, "owner"))}</div>
          )}
        </section>

        {(sent.length > 0 || profile.kind !== "player") && (
          <section className="flex flex-col gap-3">
            <div className="section-heading">
              <div>
                <h2>Enviadas</h2>
                <span>Lo que ofreciste por listas de otros jugadores</span>
              </div>
            </div>
            {sent.length === 0 ? (
              <div className="empty-state">
                <p>No has hecho ofertas. Abre una lista pública y usa &quot;Hacer oferta por el lote&quot;.</p>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">{sent.map((o) => card(o, "seller"))}</div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

type CardProps = {
  offer: InboxOffer;
  actor: OfferActor;
  profile: Profile;
  contacts: ReadonlyMap<string, string>;
  hasWhatsapp: boolean;
};

function OfferCard({ offer, actor, profile, contacts, hasWhatsapp }: CardProps) {
  const otherName = actor === "owner" ? offer.sellerName : offer.ownerName;
  const total = formatMxn(offer.totalMxnCents);
  const accepted = offer.status === "accepted";

  // Contacto de la otra parte: una tienda vendedora tiene WhatsApp público; un particular, solo con la oferta aceptada.
  const otherWhatsapp = !accepted
    ? null
    : actor === "owner"
      ? sellerWhatsapp({ id: offer.sellerId, isStore: offer.sellerIsStore, storeWhatsapp: offer.storeWhatsapp }, contacts)
      : (contacts.get(offer.ownerId) ?? null);
  // Una tienda que vende ya tiene su WhatsApp público; no necesita el de su cuenta.
  const otherCanWrite = hasWhatsapp || (actor === "seller" && offer.sellerIsStore && offer.storeWhatsapp !== null);
  const link = otherWhatsapp ? whatsappLink(otherWhatsapp, dealMessage(profile.displayName, offer.listName, total)) : null;

  return (
    <article className={`${ui.card} flex flex-col gap-3`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={ui.h3}>
            {actor === "owner" ? `${offer.sellerName}${offer.sellerIsStore ? " (tienda)" : ""}` : `Para ${offer.ownerName}`}
          </p>
          <p className={ui.muted}>
            <Link href={`/listas/${offer.listId}`} className={ui.link}>
              {offer.listName}
            </Link>{" "}
            · {daysAgoLabel(offer.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-xl font-extrabold text-accent-soft">{total}</p>
          <span className={STATUS_BADGE[offer.status]}>{STATUS_LABEL[offer.status]}</span>
        </div>
      </header>

      <ul className="flex flex-col gap-1 text-xs">
        {offer.items.map((item, index) => (
          <li key={index}>
            <span className="text-muted">{item.quantity}×</span> {item.name}
          </li>
        ))}
      </ul>
      {offer.message && <p className="rounded-lg border border-line-soft bg-canvas p-3 text-xs">“{offer.message}”</p>}

      {offer.status === "pending" && <StatusButtons offerId={offer.id} actor={actor} />}

      {accepted && (
        <div className="flex flex-col gap-2">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={`${ui.button} self-start`}>
              Escribir a {otherName} por WhatsApp
            </a>
          ) : (
            <p className={ui.muted}>{otherName} no ha registrado su WhatsApp; espera a que te escriba.</p>
          )}
          {!otherCanWrite && (
            <p className={ui.muted}>
              Agrega tu WhatsApp en{" "}
              <Link href="/cuenta" className={ui.link}>
                Mi cuenta
              </Link>{" "}
              para que {otherName} también te pueda escribir.
            </p>
          )}
          {offer.myRating === null ? (
            <RatingForm offerId={offer.id} otherName={otherName} />
          ) : (
            <p className={ui.muted}>
              Calificaste a {otherName} con <span className="text-accent-soft">{"★".repeat(offer.myRating)}</span>
              {"☆".repeat(5 - offer.myRating)}.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
