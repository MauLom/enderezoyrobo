"use client";
import { Autour_One } from "next/font/google";
import Image from "next/image";
import { FormEvent, MouseEvent, ReactNode, useEffect, useState } from "react";

type IconName =
  | "home"
  | "search"
  | "store"
  | "heart"
  | "users"
  | "message"
  | "bell"
  | "plus"
  | "sliders"
  | "chevron"
  | "map"
  | "spark"
  | "close";

type CardListing = {
  name: string;
  set: string;
  edition: string;
  condition: string;
  price: number;
  seller: string;
  location: string;
  initials: string;
  accent: string;
  distance: number;
  image?: string;
};

const listings: CardListing[] = [
  {
    name: "Sheoldred, the Apocalypse",
    set: "DMU",
    edition: "Dominaria United",
    condition: "NM",
    price: 1240,
    seller: "Diego A.",
    location: "San Pedro",
    initials: "DA",
    accent: "violet",
    distance: 6,
  },
  {
    name: "Orcish Bowmasters",
    set: "LTR",
    edition: "Tales of Middle-earth",
    condition: "NM",
    price: 890,
    seller: "Valeria M.",
    location: "Cumbres",
    initials: "VM",
    accent: "orange",
    distance: 9,
  },
  {
    name: "The One Ring",
    set: "LTR",
    edition: "Tales of Middle-earth",
    condition: "LP",
    price: 1180,
    seller: "Carlos R.",
    location: "Centro",
    initials: "CR",
    accent: "blue",
    distance: 11,
  },
  {
    name: "Bloodstained Mire",
    set: "MH3",
    edition: "Modern Horizons 3",
    condition: "NM",
    price: 410,
    seller: "Ana Sofía",
    location: "Apodaca",
    initials: "AS",
    accent: "rose",
    distance: 24,
  },
  {
    name: "Solitude",
    set: "MH2",
    edition: "Modern Horizons 2",
    condition: "NM",
    price: 680,
    seller: "Marco T.",
    location: "Guadalupe",
    initials: "MT",
    accent: "teal",
    distance: 18,
  },
  {
    name: "Atraxa, Grand Unifier",
    set: "ONE",
    edition: "Phyrexia: All Will Be One",
    condition: "NM",
    price: 320,
    seller: "Luis N.",
    location: "Escobedo",
    initials: "LN",
    accent: "green",
    distance: 31,
  },
];

const navItems: { label: string; icon: IconName; count?: number }[] = [
  { label: "Inicio", icon: "home" },
  { label: "Marketplace", icon: "store" },
  { label: "Mi wishlist", icon: "heart", count: 8 },
  { label: "Comunidad", icon: "users" },
  { label: "Mensajes", icon: "message", count: 3 },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10.8 9-7.2 9 7.2" /><path d="M5 9.8V20h14V9.8M9 20v-6h6v6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    store: <><path d="M4 9v11h16V9M3 4h18l-1.5 5H4.5L3 4Z" /><path d="M8 13h8M12 13v7" /></>,
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="7" cy="18" r="2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m5 15 .7 2.3L8 18.5l-2.3 1.2L5 22l-.7-2.3L2 18.5l2.3-1.2L5 15Z" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Button({
  children,
  className = "",
  onClick,
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return <button className={className} onClick={onClick} type={type} aria-label={ariaLabel}>{children}</button>;
}

function App() {
  const [activeNav, setActiveNav] = useState("Marketplace");
  const [activeFilter, setActiveFilter] = useState("Todo");
  const [favoriteNames, setFavoriteNames] = useState<string[]>(["Orcish Bowmasters", "The One Ring"]);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const suggestions = search.trim().length < 2
    ? []
    : listings.filter(item => item.name.toLowerCase().includes(search.toLowerCase())).map(item => item.name);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardListing | null>(null);
  const [radius, setRadius] = useState(15);
  const [likedTopics, setLikedTopics] = useState<string[]>(["play", "cards"]);
  const [activeChat, setActiveChat] = useState("Valeria M.");
  const [messageDraft, setMessageDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      listings.map(async (card) => {
        try {
          const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`);
          const data = await response.json();
          const image = data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal;
          return [card.name, image] as const;
        } catch {
          return [card.name, undefined] as const;
        }
      }),
    ).then((items) => {
      if (!cancelled) {
        setCardImages(Object.fromEntries(items.filter((item) => item[1])));
      }
    });
    return () => { cancelled = true; };
  }, []);

  function toggleFavorite(name: string) {
    setFavoriteNames((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function selectSuggestion(name: string) {
    setSearch(name);
    setShowSuggestions(false);
    setToast(`${name} se agregó a tu búsqueda`);
    window.setTimeout(() => setToast(""), 2600);
  }

  function publishCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowPublish(false);
    setToast("Tu carta se publicó correctamente");
    window.setTimeout(() => setToast(""), 2600);
  }

  function publishCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast("Tu publicación ya está en la comunidad");
    window.setTimeout(() => setToast(""), 2600);
    (event.currentTarget.elements.namedItem("post") as HTMLTextAreaElement).value = "";
  }

  function likeTopic(topic: string) {
    setLikedTopics((current) => current.includes(topic) ? current : [...current, topic]);
    setToast("Usaremos este interés para mejorar tu inicio");
    window.setTimeout(() => setToast(""), 2600);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageDraft.trim()) return;
    setSentMessages((current) => [...current, messageDraft.trim()]);
    setMessageDraft("");
  }

  const wishlistListings = listings.filter((card) => favoriteNames.includes(card.name));
  const nearbyListings = listings.filter((card) => card.distance <= radius && !favoriteNames.includes(card.name));
  const recentListings = listings.filter((card) => !favoriteNames.includes(card.name) && !nearbyListings.includes(card));
  const forYouListings = [...wishlistListings, ...nearbyListings, ...recentListings];

  function renderCards(cards: CardListing[]) {
    return (
      <div className="card-grid">
        {cards.map((card) => (
          <article className="listing-card" key={card.name} onClick={() => setSelectedCard(card)}>
            <div className="card-image-wrap">
              {cardImages[card.name] ? (
                <Image src={cardImages[card.name]} alt={card.name} width={25} height={50}/>
              ) : (
                <div className="card-skeleton"><span>MAZO</span></div>
              )}
              <span className="condition">{card.condition}</span>
              <Button
                ariaLabel={favoriteNames.includes(card.name) ? "Quitar de wishlist" : "Agregar a wishlist"}
                className={`heart-button ${favoriteNames.includes(card.name) ? "saved" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(card.name);
                }}
              >
                <Icon name="heart" size={18} />
              </Button>
            </div>
            <div className="listing-info">
              <div className="set-line"><span>{card.set}</span>{card.edition}</div>
              <h3>{card.name}</h3>
              <div className="price">${card.price.toLocaleString("es-MX")} <small>MXN desde</small></div>
              <div className="seller">
                <div className={`mini-avatar ${card.accent}`}>{card.initials}</div>
                <div><strong>{card.seller}</strong><span><Icon name="map" size={12} /> {card.location}</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={`app-shell ${activeNav === "Mensajes" ? "messages-mode" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>M</span></div>
          <div><strong>MAZO</strong><small>MONTERREY</small></div>
        </div>
        <div className="global-search">
          <Icon name="search" size={18} />
          <input
            aria-label="Buscar cartas, sets o jugadores"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            placeholder="Busca una carta, set o jugador..."
          />
          <kbd>⌘ K</kbd>
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-results">
              <div className="results-label">Resultados de Scryfall</div>
              {suggestions.map((item) => (
                <Button key={item} className="suggestion" onClick={() => selectSuggestion(item)}>
                  <Icon name="search" size={16} /><span>{item}</span><Icon name="chevron" size={15} />
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="header-actions">
          <Button className="icon-button" ariaLabel="Notificaciones"><Icon name="bell" size={20} /><span className="notification-dot" /></Button>
          <Button className="publish-button" onClick={() => setShowPublish(true)}><Icon name="plus" size={18} /> Publicar carta</Button>
          <Button className="profile-button" ariaLabel="Abrir perfil">JP</Button>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <div className="nav-label">Explorar</div>
          {navItems.map((item) => (
            <Button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => setActiveNav(item.label)}>
              <Icon name={item.icon} size={19} /><span>{item.label}</span>
              {item.count && <b>{item.count}</b>}
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <div className="local-icon"><Icon name="map" size={20} /></div>
            <strong>Comunidad MTY</strong>
            <p>1,284 coleccionistas activos en Nuevo León</p>
            <Button className="text-button">Ver comunidad <Icon name="chevron" size={14} /></Button>
          </div>
          <div className="user-row">
            <div className="avatar">JP</div>
            <div><strong>Javier Peña</strong><span>@javierp</span></div>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activeNav === "Inicio" ? (
          <div className="community-page home-feed">
            <section className="welcome">
              <div>
                <div className="eyebrow"><span /> PARA TI</div>
                <h1>Hola, Javier.</h1>
                <p>Recomendaciones basadas en lo que te interesa dentro de la comunidad.</p>
              </div>
            </section>
            <div className="interest-note"><Icon name="spark" size={17} /><div><strong>Tu inicio aprende de tus likes</strong><span>Ahora te mostramos partidas de Commander y cartas en venta.</span></div></div>
            <div className="feed">
              {likedTopics.includes("play") && (
                <article className="post-card recommended-post">
                  <div className="recommendation-label">PORQUE TE INTERESAN LAS PARTIDAS</div>
                  <div className="post-author"><div className="activity-avatar violet">EC</div><div><strong>El Calabozo MTY</strong><span>Contry · Hace 24 min</span></div></div>
                  <p>Mesa abierta de Commander casual hoy a las 7:30 pm. Tenemos dos lugares y aceptamos proxies.</p>
                  <div className="event-card"><div><span>HOY</span><strong>19:30</strong></div><div><strong>Commander casual</strong><span>El Calabozo · 4.8 km</span></div><Button>Me interesa</Button></div>
                  <div className="post-stats"><span>9 jugadores interesados</span><span>4 comentarios</span></div>
                  <div className="post-actions"><Button><Icon name="heart" size={17} /> Me interesa</Button><Button><Icon name="message" size={17} /> Comentar</Button></div>
                </article>
              )}
              {likedTopics.includes("cards") && (
                <article className="post-card recommended-post">
                  <div className="recommendation-label">PORQUE BUSCASTE THE ONE RING</div>
                  <div className="post-author"><div className="activity-avatar blue">CR</div><div><strong>Carlos R.</strong><span>Monterrey Centro · Hace 42 min</span></div></div>
                  <p>Tengo una copia de The One Ring en excelentes condiciones. Puedo entregar hoy en el centro.</p>
                  <div className="inline-card-offer" onClick={() => setSelectedCard(listings[2])}>
                    {cardImages[listings[2].name] && <Image src={cardImages[listings[2].name]} alt={listings[2].name} />}
                    <div><span>LTR · LP</span><strong>The One Ring</strong><b>$1,180 MXN</b><small><Icon name="map" size={11} /> A 11 km de ti</small></div>
                    <Icon name="chevron" size={18} />
                  </div>
                  <div className="post-actions"><Button><Icon name="heart" size={17} /> Guardar</Button><Button onClick={() => setActiveNav("Mensajes")}><Icon name="message" size={17} /> Enviar mensaje</Button></div>
                </article>
              )}
              {likedTopics.includes("market") && (
                <article className="post-card recommended-post">
                  <div className="recommendation-label">PORQUE TE INTERESAN LOS LOTES</div>
                  <div className="post-author"><div className="activity-avatar orange">MD</div><div><strong>Mario D.</strong><span>San Nicolás · Hace 1 h</span></div></div>
                  <p>Vendo lote de 600 cartas de Standard y Commander por $650. Incluye algunas raras y tokens.</p>
                  <div className="post-actions"><Button><Icon name="heart" size={17} /> Me interesa</Button><Button><Icon name="message" size={17} /> Comentar</Button></div>
                </article>
              )}
            </div>
          </div>
        ) : activeNav === "Comunidad" ? (
          <div className="community-page">
            <section className="welcome">
              <div>
                <div className="eyebrow"><span /> COMUNIDAD MTY</div>
                <h1>Entre jugadores, todo se encuentra.</h1>
                <p>Publica ventas, intercambios, eventos o lo que estás buscando.</p>
              </div>
            </section>
            <form className="community-composer" onSubmit={publishCommunityPost}>
              <div className="avatar">JP</div>
              <textarea name="post" required placeholder="¿Qué quieres compartir con la comunidad?" />
              <div className="composer-actions">
                <label className="photo-action"><input type="file" accept="image/*" />＋ Foto</label>
                <Button type="submit" className="post-button">Publicar</Button>
              </div>
            </form>
            <div className="feed">
              <article className="post-card">
                <div className="post-author"><div className="activity-avatar orange">RG</div><div><strong>Raúl Garza</strong><span>San Nicolás · Hace 18 min</span></div></div>
                <p>Estoy vendiendo este bulk de más de 1,200 cartas a $1,000. Hay cartas desde Ixalan hasta Thunder Junction. Entrego en Punto Valle o estación Anáhuac.</p>
                <div className="bulk-photo">
                  {listings.slice(0, 4).map((card) => cardImages[card.name] && <Image key={card.name} src={cardImages[card.name]} alt="" />)}
                  <div><strong>1,200+</strong><span>cartas en el lote</span></div>
                </div>
                <div className="post-stats"><span>12 interesados</span><span>8 comentarios</span></div>
                <div className="post-actions"><Button onClick={() => likeTopic("market")}><Icon name="heart" size={17} /> Me interesa</Button><Button><Icon name="message" size={17} /> Comentar</Button></div>
              </article>
              <article className="post-card">
                <div className="post-author"><div className="activity-avatar blue">AM</div><div><strong>Alejandra M.</strong><span>Monterrey Centro · Hace 1 h</span></div></div>
                <p>¿Alguien para Commander casual este sábado? Nos faltan dos personas para completar mesa.</p>
                <div className="post-stats"><span>6 interesados</span><span>14 comentarios</span></div>
                <div className="post-actions"><Button onClick={() => likeTopic("play")}><Icon name="heart" size={17} /> Me interesa</Button><Button><Icon name="message" size={17} /> Comentar</Button></div>
              </article>
            </div>
          </div>
        ) : activeNav === "Mensajes" ? (
          <div className="messenger">
            <aside className="chat-list">
              <div className="chat-list-head"><div><span>MENSAJES</span><h1>Chats</h1></div><Button ariaLabel="Nuevo mensaje"><Icon name="plus" size={18} /></Button></div>
              <div className="chat-search"><Icon name="search" size={16} /><input placeholder="Buscar conversación" /></div>
              {[
                ["Valeria M.", "¿Te queda bien Punto Valle?", "VM", "2 min", "orange"],
                ["Carlos R.", "Sí, todavía tengo The One Ring", "CR", "34 min", "blue"],
                ["Alejandra M.", "Nos vemos el sábado entonces", "AM", "1 h", "violet"],
                ["Toño Cards", "Te mando fotos de la carta", "TC", "Ayer", "green"],
              ].map(([name, preview, initials, time, color], index) => (
                <Button key={name} className={`chat-preview ${activeChat === name ? "active" : ""}`} onClick={() => setActiveChat(name)}>
                  <div className={`chat-avatar ${color}`}>{initials}<span /></div>
                  <div><strong>{name}</strong><p>{preview}</p></div>
                  <div className="chat-meta"><span>{time}</span>{index === 0 && <b>2</b>}</div>
                </Button>
              ))}
            </aside>
            <section className="conversation">
              <div className="conversation-head">
                <div className="chat-avatar orange">VM<span /></div>
                <div><strong>{activeChat}</strong><span>Activo hace 5 min</span></div>
                <Button ariaLabel="Información"><span className="info-icon">i</span></Button>
              </div>
              <div className="messages">
                <div className="day-label">Hoy, 12:40</div>
                <div className="message received">Hola, vi que guardaste mi publicación de Orcish Bowmasters.</div>
                <div className="message sent">¡Hola! Sí, me interesa. ¿Sigue disponible?</div>
                <div className="message received">Sí, está en NM. Puedo entregarla en San Pedro o Punto Valle.</div>
                <div className="message sent">Perfecto. ¿Te queda bien Punto Valle a las 6?</div>
                <div className="message received">¿Te queda bien Punto Valle?</div>
                {sentMessages.map((message, index) => <div className="message sent" key={`${message}-${index}`}>{message}</div>)}
              </div>
              <form className="message-composer" onSubmit={sendMessage}>
                <Button ariaLabel="Adjuntar"><Icon name="plus" size={19} /></Button>
                <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Escribe un mensaje..." />
                <Button type="submit" className="send-button" ariaLabel="Enviar"><Icon name="chevron" size={18} /></Button>
              </form>
            </section>
          </div>
        ) : (
        <>
        <section className="welcome">
          <div>
            <div className="eyebrow"><span /> MARKETPLACE LOCAL</div>
            <h1>Encuentra tu próxima carta.</h1>
            <p>Compra, vende e intercambia con jugadores de la comunidad de Monterrey.</p>
          </div>
        </section>

        <section className="toolbar">
          <div className="filters">
            {["Todo", "Cerca de mí", "Wishlist"].map((filter) => (
              <Button key={filter} className={activeFilter === filter ? "filter active" : "filter"} onClick={() => setActiveFilter(filter)}>
                {filter === "Cerca de mí" && <Icon name="map" size={15} />}
                {filter === "Wishlist" && <Icon name="heart" size={15} />}
                {filter}
              </Button>
            ))}
          </div>
          <div className="market-tools">
            <label className="radius-control"><Icon name="map" size={15} /><span>Radio</span><select value={radius} onChange={(event) => setRadius(Number(event.target.value))}><option value="5">5 km</option><option value="10">10 km</option><option value="15">15 km</option><option value="25">25 km</option><option value="50">50 km</option></select></label>
            <Button className="sort-button"><Icon name="sliders" size={17} /> Filtros <span>2</span></Button>
          </div>
        </section>

        <section className="listing-section">
          <div className="section-heading">
            <div><h2>{activeFilter === "Todo" ? "Para ti" : activeFilter}</h2><span>{activeFilter === "Todo" ? "Ordenado según tus intereses y ubicación" : activeFilter === "Cerca de mí" ? `En un radio de ${radius} km` : "Cartas que guardaste"}</span></div>
            <Button className="view-all">Ver todas <Icon name="chevron" size={15} /></Button>
          </div>
          {renderCards(activeFilter === "Todo" ? forYouListings : activeFilter === "Cerca de mí" ? nearbyListings : wishlistListings)}
        </section>
        </>
        )}
      </main>

      <aside className="right-rail">
        <div className="rail-heading">
          <div><span className="rail-icon"><Icon name="heart" size={17} /></span><h2>Tu wishlist</h2></div>
          <Button>Ver todo</Button>
        </div>
        <p className="rail-copy">Hay 3 cartas disponibles cerca de ti</p>
        <div className="wishlist-list">
          {[
            ["Rhystic Study", "WOT", "$780", "3 ofertas"],
            ["Mana Vault", "2XM", "$1,240", "1 oferta"],
            ["Ancient Copper Dragon", "CLB", "$920", "2 ofertas"],
          ].map(([name, set, price, offers], index) => (
            <div className="wishlist-item" key={name}>
              <div className={`wish-thumb wish-${index}`}><Icon name="spark" size={17} /></div>
              <div className="wish-name"><strong>{name}</strong><span>{set} · {offers}</span></div>
              <div className="wish-price"><strong>{price}</strong><span>MXN</span></div>
            </div>
          ))}
        </div>
        <Button className="manage-button"><Icon name="heart" size={16} /> Administrar wishlist</Button>
      </aside>

      {showPublish && (
        <div className="modal-backdrop" onMouseDown={() => setShowPublish(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><span>MARKETPLACE</span><h2>Publica una carta</h2></div><Button className="modal-close" onClick={() => setShowPublish(false)} ariaLabel="Cerrar"><Icon name="close" /></Button></div>
            <form onSubmit={publishCard}>
              <label>Nombre de la carta<input required placeholder="Ej. Lightning Bolt" /></label>
              <div className="field-row">
                <label>Precio (MXN)<input required type="number" min="1" placeholder="450" /></label>
                <label>Condición<select defaultValue="NM"><option>NM</option><option>LP</option><option>MP</option></select></label>
              </div>
              <label>Zona de entrega<input required placeholder="San Pedro, Centro..." /></label>
              <Button type="submit" className="modal-submit">Publicar en marketplace</Button>
            </form>
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedCard(null)}>
          <div className="modal offers-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><span>OFERTAS DISPONIBLES</span><h2>{selectedCard.name}</h2></div><Button className="modal-close" onClick={() => setSelectedCard(null)} ariaLabel="Cerrar"><Icon name="close" /></Button></div>
            <div className="offer-summary">
              {cardImages[selectedCard.name] && <Image src={cardImages[selectedCard.name]} alt={selectedCard.name} />}
              <div><span>Mejor precio desde</span><strong>${selectedCard.price.toLocaleString("es-MX")} MXN</strong><small>{selectedCard.edition} · {selectedCard.set}</small></div>
            </div>
            <div className="offers-list">
              {[
                [selectedCard.seller, selectedCard.location, selectedCard.condition, selectedCard.price],
                ["Mariana G.", "San Jerónimo", "NM", selectedCard.price + 90],
                ["Toño Cards", "San Nicolás", "LP", selectedCard.price + 140],
              ].map(([seller, location, condition, price], index) => (
                <div className="offer-row" key={String(seller)}>
                  <div className={`activity-avatar ${["violet", "blue", "green"][index]}`}>{String(seller).slice(0, 2).toUpperCase()}</div>
                  <div><strong>{seller}</strong><span><Icon name="map" size={11} /> {location} · {condition}</span></div>
                  <b>${Number(price).toLocaleString("es-MX")}</b>
                  <Button onClick={() => { setSelectedCard(null); setToast(`Mensaje enviado a ${seller}`); }}>Contactar</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast"><span><Icon name="spark" size={17} /></span>{toast}</div>}
    </div>
  );
}

export default App;
