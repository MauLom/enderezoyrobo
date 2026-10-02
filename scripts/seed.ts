/**
 * Datos de prueba para validar flujos: tiendas (verificadas, pendientes y una
 * rechazada), un vendedor, jugadores con want lists, ofertas, contactos
 * privados, una calificación y un moderador. Requiere el catálogo cargado (sync:catalogo).
 *
 *   npm run seed                    # borra y vuelve a crear los datos de prueba
 *   npm run seed -- --limpiar       # solo borra los datos de prueba
 *   npm run seed -- --remoto        # necesario si DATABASE_URL no es local
 *
 * Todos los usuarios de prueba tienen correo @mazo.test y "(prueba)" en el
 * nombre; borrarlos borra en cascada todo lo demás. En local pueden entrar con
 * código: el correo llega a Mailpit (http://127.0.0.1:54324).
 */
import postgres from "postgres";

const SEED_DOMAIN = "@mazo.test";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta DATABASE_URL");

const isLocal = ["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname);
const args = new Set(process.argv.slice(2));
if (!isLocal && !args.has("--remoto")) {
  throw new Error(
    "DATABASE_URL no es local. Los datos de prueba se ven públicamente en la app; si es a propósito, agrega --remoto.",
  );
}

const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });
type Tx = postgres.TransactionSql;

// Personas ---------------------------------------------------------------------

type Person = {
  key: string;
  email: string;
  displayName: string;
  kind: "player" | "seller" | "store";
  verified?: boolean;
  /** WhatsApp privado (tabla contact): solo lo ve la otra parte de una oferta aceptada. */
  whatsapp?: string;
  /** Municipio de DELIVERY_ZONES (src/lib/account/validation.ts). */
  deliveryZone?: string;
  store?: {
    name: string;
    address: string;
    whatsapp: string;
    priceNote: string | null;
    verified: boolean;
    updatedDaysAgo: number;
    registeredDaysAgo?: number;
    /** Motivo de rechazo del staff (tabla store_rejection). */
    rejection?: string;
  };
  /** Owner o moderador (tabla staff): ve /tiendas. */
  staffRole?: "owner" | "moderator";
};

const PEOPLE: Person[] = [
  {
    key: "dragon",
    email: `tienda.dragon${SEED_DOMAIN}`,
    displayName: "Tienda El Dragón (prueba)",
    kind: "store",
    verified: true,
    store: {
      name: "Tienda El Dragón (prueba)",
      address: "Av. Constitución 100, Centro, Monterrey",
      whatsapp: "+528100000001",
      priceNote: "TCGplayer −10 %",
      verified: true,
      updatedDaysAgo: 2,
    },
  },
  {
    key: "guarida",
    email: `tienda.guarida${SEED_DOMAIN}`,
    displayName: "La Guarida TCG (prueba)",
    kind: "store",
    verified: true,
    store: {
      name: "La Guarida TCG (prueba)",
      address: "Calzada del Valle 200, San Pedro Garza García",
      whatsapp: "+528100000002",
      priceNote: "Card Kingdom",
      verified: true,
      updatedDaysAgo: 10,
    },
  },
  {
    // Sin verificar y con inventario viejo: para probar insignia y "actualizado hace X días".
    key: "barrio",
    email: `tienda.barrio${SEED_DOMAIN}`,
    displayName: "Cartas del Barrio (prueba)",
    kind: "store",
    store: {
      name: "Cartas del Barrio (prueba)",
      address: "Av. Universidad 300, San Nicolás de los Garza",
      whatsapp: "+528100000003",
      priceNote: "SCG",
      verified: false,
      updatedDaysAgo: 45,
    },
  },
  {
    // Recién registrada desde /cuenta, sin inventario: primera en "Por revisar" de /tiendas.
    key: "nueva",
    email: `tienda.nueva${SEED_DOMAIN}`,
    displayName: "Dados y Mazos (prueba)",
    kind: "store",
    store: {
      name: "Dados y Mazos (prueba)",
      address: "Av. Lincoln 450, Mitras Centro, Monterrey",
      whatsapp: "+528100000004",
      priceNote: null,
      verified: false,
      updatedDaysAgo: 0,
      registeredDaysAgo: 0,
    },
  },
  {
    // Rechazada por el staff: ve el motivo en /cuenta y, al corregir sus datos, vuelve a revisión.
    key: "rechazada",
    email: `tienda.rechazada${SEED_DOMAIN}`,
    displayName: "Cartas Express (prueba)",
    kind: "store",
    store: {
      name: "Cartas Express (prueba)",
      address: "Centro",
      whatsapp: "+528100000005",
      priceNote: "TCGplayer",
      verified: false,
      updatedDaysAgo: 3,
      registeredDaysAgo: 3,
      rejection: "La dirección no dice calle ni número y el WhatsApp no contestó. Corrige la dirección y avísanos.",
    },
  },
  { key: "moderador", email: `moderador${SEED_DOMAIN}`, displayName: "Moderador (prueba)", kind: "player", staffRole: "moderator" },
  { key: "ana", email: `vendedora.ana${SEED_DOMAIN}`, displayName: "Ana (prueba)", kind: "seller", whatsapp: "+528100000010", deliveryZone: "San Nicolás de los Garza" },
  { key: "beto", email: `jugador.beto${SEED_DOMAIN}`, displayName: "Beto (prueba)", kind: "player", whatsapp: "+528100000011", deliveryZone: "Monterrey" },
  { key: "carla", email: `jugadora.carla${SEED_DOMAIN}`, displayName: "Carla (prueba)", kind: "player" },
];

// Inventario -------------------------------------------------------------------

type Condition = "NM" | "LP" | "MP" | "HP" | "DMG";

/** Carta por nombre; con set y número se usa esa impresión exacta. */
type CardRef = { name: string; set?: string; number?: string };

type Stock = { card: CardRef; condition: Condition; qty: number; priceMxn: number; foil?: boolean; lang?: string };

const SOL_RING: CardRef = { name: "Sol Ring", set: "c21", number: "263" };
const ATRAXA_2XM: CardRef = { name: "Atraxa, Praetors' Voice", set: "2xm", number: "190" };

const INVENTORY: Record<string, Stock[]> = {
  dragon: [
    { card: SOL_RING, condition: "NM", qty: 3, priceMxn: 45 },
    { card: { name: "Arcane Signet" }, condition: "NM", qty: 4, priceMxn: 20 },
    { card: { name: "Command Tower" }, condition: "NM", qty: 6, priceMxn: 10 },
    { card: ATRAXA_2XM, condition: "LP", qty: 1, priceMxn: 350 },
    { card: { name: "Rhystic Study" }, condition: "NM", qty: 1, priceMxn: 780 },
    { card: { name: "Cyclonic Rift" }, condition: "LP", qty: 2, priceMxn: 520 },
    { card: { name: "Lightning Bolt" }, condition: "NM", qty: 8, priceMxn: 25 },
    { card: { name: "Counterspell" }, condition: "LP", qty: 4, priceMxn: 30 },
    { card: { name: "Swords to Plowshares" }, condition: "NM", qty: 3, priceMxn: 40 },
  ],
  guarida: [
    { card: SOL_RING, condition: "MP", qty: 2, priceMxn: 30 },
    { card: { name: "Smothering Tithe" }, condition: "NM", qty: 1, priceMxn: 480, foil: true },
    { card: { name: "Smothering Tithe" }, condition: "LP", qty: 1, priceMxn: 330 },
    { card: { name: "Rhystic Study" }, condition: "MP", qty: 1, priceMxn: 600 },
    { card: { name: "Brainstorm" }, condition: "NM", qty: 4, priceMxn: 15 },
    { card: { name: "Ponder" }, condition: "NM", qty: 4, priceMxn: 12 },
    { card: { name: "Lightning Bolt" }, condition: "LP", qty: 4, priceMxn: 20 },
    { card: { name: "Thoughtseize" }, condition: "NM", qty: 2, priceMxn: 290, lang: "es" },
    { card: { name: "Fatal Push" }, condition: "NM", qty: 3, priceMxn: 110 },
  ],
  barrio: [
    { card: { name: "Counterspell" }, condition: "HP", qty: 4, priceMxn: 15 },
    { card: { name: "Dark Ritual" }, condition: "LP", qty: 4, priceMxn: 10 },
    { card: { name: "Birds of Paradise" }, condition: "MP", qty: 2, priceMxn: 150 },
    { card: { name: "Demonic Tutor" }, condition: "DMG", qty: 1, priceMxn: 500 },
  ],
  ana: [
    { card: { name: "Llanowar Elves" }, condition: "NM", qty: 4, priceMxn: 8 },
    { card: { name: "Path to Exile" }, condition: "LP", qty: 2, priceMxn: 35 },
    { card: { name: "Cyclonic Rift" }, condition: "NM", qty: 1, priceMxn: 560, foil: true },
  ],
};

// Want lists -------------------------------------------------------------------

type Want = {
  card: CardRef;
  qty: number;
  minCondition?: Condition;
  foil?: "yes" | "no" | "any";
  lang?: string;
  /** Pedir esa impresión exacta y no cualquiera del mismo oracle id. */
  exact?: boolean;
};

type WantListSeed = { owner: string; name: string; isPublic: boolean; items: Want[] };

const WANT_LISTS: WantListSeed[] = [
  {
    // Cobertura parcial repartida entre tiendas; Demonic Tutor solo está DMG (no cumple la condición mínima).
    owner: "beto",
    name: "Commander de Atraxa",
    isPublic: true,
    items: [
      { card: SOL_RING, qty: 1 },
      { card: ATRAXA_2XM, qty: 1, exact: true },
      { card: { name: "Rhystic Study" }, qty: 1, minCondition: "NM" },
      { card: { name: "Smothering Tithe" }, qty: 1, foil: "yes" },
      { card: { name: "Cyclonic Rift" }, qty: 1 },
      { card: { name: "Arcane Signet" }, qty: 1 },
      { card: { name: "Command Tower" }, qty: 1 },
      { card: { name: "Demonic Tutor" }, qty: 1 },
    ],
  },
  {
    owner: "beto",
    name: "Modern (privada)",
    isPublic: false,
    items: [
      { card: { name: "Thoughtseize" }, qty: 4, lang: "es" },
      { card: { name: "Fatal Push" }, qty: 4 },
    ],
  },
  {
    // Cantidades mayores al inventario de una sola tienda.
    owner: "carla",
    name: "Pauper Izzet",
    isPublic: true,
    items: [
      { card: { name: "Lightning Bolt" }, qty: 4 },
      { card: { name: "Counterspell" }, qty: 4, minCondition: "MP" },
      { card: { name: "Brainstorm" }, qty: 4 },
      { card: { name: "Ponder" }, qty: 4 },
    ],
  },
];

// Carga ------------------------------------------------------------------------

type Printing = { id: string; oracleId: string };

async function resolveCard(tx: Tx, card: CardRef): Promise<Printing> {
  const rows = card.set
    ? await tx<{ id: string; oracle_id: string }[]>`
        select id, oracle_id from card_printing
        where name = ${card.name} and set_code = ${card.set} and collector_number = ${card.number ?? ""}`
    : await tx<{ id: string; oracle_id: string }[]>`
        select p.id, p.oracle_id from card_printing p
        where p.name = ${card.name} and p.lang = 'en'
        order by exists (select 1 from price_reference r where r.printing_id = p.id) desc, p.released_at desc nulls last
        limit 1`;
  if (rows.length === 0) {
    throw new Error(`No encontré "${card.name}"${card.set ? ` (${card.set} ${card.number})` : ""} en el catálogo`);
  }
  return { id: rows[0].id, oracleId: rows[0].oracle_id };
}

async function deleteSeed(tx: Tx): Promise<number> {
  // profile y todo lo que cuelga de él se borra en cascada desde auth.users.
  const deleted = await tx`delete from auth.users where email like ${`%${SEED_DOMAIN}`}`;
  return deleted.count;
}

/** Usuario confirmado por correo, con su identidad, como lo dejaría el registro con código. */
async function createUser(tx: Tx, person: Person): Promise<string> {
  const [{ id }] = await tx<{ id: string }[]>`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      ${person.email}, '', now(),
      ${tx.json({ provider: "email", providers: ["email"] })},
      ${tx.json({ display_name: person.displayName })},
      now(), now(), '', '', '', ''
    )
    returning id`;
  await tx`
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values (${id}, ${id}, ${tx.json({ sub: id, email: person.email, email_verified: true })}, 'email', now(), now())`;
  // El trigger handle_new_user ya creó el profile; aquí se completa.
  await tx`
    update profile set kind = ${person.kind}, verified = ${person.verified ?? false}, delivery_zone = ${person.deliveryZone ?? null}
    where id = ${id}`;
  return id;
}

async function seed(tx: Tx) {
  const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from card_printing`;
  if (count === 0) throw new Error("El catálogo está vacío: corre primero npm run sync:catalogo");

  const ids: Record<string, string> = {};
  for (const person of PEOPLE) {
    ids[person.key] = await createUser(tx, person);
    if (person.whatsapp) {
      await tx`insert into contact (profile_id, whatsapp) values (${ids[person.key]}, ${person.whatsapp})`;
    }
    const store = person.store;
    if (store) {
      const [{ id: storeId }] = await tx<{ id: string }[]>`
        insert into store (profile_id, name, address, whatsapp, price_reference_note, verified_at, inventory_updated_at, created_at)
        values (${ids[person.key]}, ${store.name}, ${store.address}, ${store.whatsapp}, ${store.priceNote},
                ${store.verified ? tx`now()` : null}, now() - make_interval(days => ${store.updatedDaysAgo}),
                now() - make_interval(days => ${store.registeredDaysAgo ?? 60}))
        returning id`;
      if (store.rejection) {
        await tx`insert into store_rejection (store_id, reason) values (${storeId}, ${store.rejection})`;
      }
    }
    if (person.staffRole) {
      await tx`insert into staff (profile_id, role) values (${ids[person.key]}, ${person.staffRole})`;
    }
  }

  const cache = new Map<string, Printing>();
  const printing = async (card: CardRef) => {
    const key = `${card.name}|${card.set ?? ""}|${card.number ?? ""}`;
    if (!cache.has(key)) cache.set(key, await resolveCard(tx, card));
    return cache.get(key)!;
  };

  let inventoryCount = 0;
  for (const [owner, stock] of Object.entries(INVENTORY)) {
    const daysAgo = PEOPLE.find((p) => p.key === owner)?.store?.updatedDaysAgo ?? 5;
    for (const item of stock) {
      const p = await printing(item.card);
      await tx`
        insert into inventory_item (seller_id, printing_id, condition, language, foil, quantity, price_mxn_cents, updated_at)
        values (${ids[owner]}, ${p.id}, ${item.condition}, ${item.lang ?? "en"}, ${item.foil ?? false},
                ${item.qty}, ${item.priceMxn * 100}, now() - make_interval(days => ${daysAgo}))`;
      inventoryCount++;
    }
  }

  const wantItemIds: Record<string, string[]> = {};
  const wantListIds: Record<string, string> = {};
  for (const list of WANT_LISTS) {
    const [{ id: listId }] = await tx<{ id: string }[]>`
      insert into want_list (owner_id, name, is_public) values (${ids[list.owner]}, ${list.name}, ${list.isPublic})
      returning id`;
    wantListIds[list.name] = listId;
    wantItemIds[list.name] = [];
    for (const item of list.items) {
      const p = await printing(item.card);
      const [{ id }] = await tx<{ id: string }[]>`
        insert into want_list_item (want_list_id, oracle_id, printing_id, quantity, min_condition, foil, language)
        values (${listId}, ${p.oracleId}, ${item.exact ? p.id : null}, ${item.qty},
                ${item.minCondition ?? "LP"}, ${item.foil ?? "any"}, ${item.lang ?? null})
        returning id`;
      wantItemIds[list.name].push(id);
    }
  }

  // Oferta pendiente de El Dragón por Sol Ring + Atraxa de la lista de Beto.
  const [pending] = await tx<{ id: string }[]>`
    insert into offer (want_list_id, seller_id, total_mxn_cents, message, status)
    values (${wantListIds["Commander de Atraxa"]}, ${ids.dragon}, ${380 * 100},
            'Te dejo Sol Ring y Atraxa en $380 si pasas esta semana.', 'pending')
    returning id`;
  const betoItems = wantItemIds["Commander de Atraxa"];
  await tx`
    insert into offer_item (offer_id, want_list_item_id, quantity)
    values (${pending.id}, ${betoItems[0]}, 1), (${pending.id}, ${betoItems[1]}, 1)`;

  // Oferta aceptada de Ana (particular) por el Cyclonic Rift foil de Beto: cada uno ve el WhatsApp del otro.
  const [anaOffer] = await tx<{ id: string }[]>`
    insert into offer (want_list_id, seller_id, total_mxn_cents, message, status)
    values (${wantListIds["Commander de Atraxa"]}, ${ids.ana}, ${560 * 100}, 'Mi Cyclonic Rift foil NM, nos vemos en la Macroplaza.', 'accepted')
    returning id`;
  await tx`
    insert into offer_item (offer_id, want_list_item_id, quantity)
    values (${anaOffer.id}, ${betoItems[4]}, 1)`;

  // Oferta aceptada de La Guarida a Carla, con calificación de Carla.
  const [accepted] = await tx<{ id: string }[]>`
    insert into offer (want_list_id, seller_id, total_mxn_cents, message, status)
    values (${wantListIds["Pauper Izzet"]}, ${ids.guarida}, ${190 * 100}, 'Brainstorm y Ponder x4 cada uno.', 'accepted')
    returning id`;
  const carlaItems = wantItemIds["Pauper Izzet"];
  await tx`
    insert into offer_item (offer_id, want_list_item_id, quantity)
    values (${accepted.id}, ${carlaItems[2]}, 4), (${accepted.id}, ${carlaItems[3]}, 4)`;
  await tx`
    insert into rating (from_id, to_id, offer_id, score, comment)
    values (${ids.carla}, ${ids.guarida}, ${accepted.id}, 5, 'Todo como lo describieron, entrega en tienda sin problema.')`;

  console.log(
    `Seed: ${PEOPLE.length} usuarios, ${inventoryCount} renglones de inventario, ${WANT_LISTS.length} want lists, 3 ofertas, 1 calificación`,
  );
  for (const person of PEOPLE) console.log(`  ${person.email.padEnd(28)} ${person.displayName}`);
}

async function main() {
  try {
    await sql.begin(async (tx) => {
      const deleted = await deleteSeed(tx);
      if (deleted > 0) console.log(`Borrados ${deleted} usuarios de prueba anteriores`);
      if (!args.has("--limpiar")) await seed(tx);
    });
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
