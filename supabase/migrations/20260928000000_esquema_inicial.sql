-- Esquema inicial de MazoTCG. Ver docs/07-datos-y-fuentes.md.
--
-- Las tablas de catálogo y precios solo se escriben con la service role (el job
-- de sincronización), que se salta RLS. Todo lo demás lo escriben los usuarios
-- bajo las políticas de RLS de abajo.

create extension if not exists pg_trgm;

create type card_condition as enum ('NM', 'LP', 'MP', 'HP', 'DMG');
create type card_finish as enum ('nonfoil', 'foil', 'etched');
create type foil_preference as enum ('yes', 'no', 'any');
create type price_source as enum ('ck', 'tcgplayer', 'cardmarket');
create type profile_kind as enum ('player', 'seller', 'store');
create type offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

-- Catálogo -------------------------------------------------------------------

-- Una fila por impresión; la llave es el ID de Scryfall.
create table card_printing (
  id uuid primary key,
  oracle_id uuid not null,
  name text not null,
  set_code text not null,
  set_name text not null,
  collector_number text not null,
  lang text not null default 'en',
  rarity text not null,
  image_uri text,
  released_at date,
  updated_at timestamptz not null default now()
);

create index card_printing_oracle_idx on card_printing (oracle_id);
create index card_printing_set_number_idx on card_printing (set_code, collector_number);
create index card_printing_name_trgm_idx on card_printing using gin (lower(name) gin_trgm_ops);

-- Solo el último precio por fuente y acabado: el historial no cabe en los
-- 500 MB del plan gratuito de Supabase.
create table price_reference (
  printing_id uuid not null references card_printing (id) on delete cascade,
  source price_source not null,
  finish card_finish not null,
  currency text not null check (currency in ('USD', 'EUR')),
  amount numeric(12, 2) not null check (amount >= 0),
  as_of date not null,
  primary key (printing_id, source, finish)
);

-- Tipo de cambio del día (Banxico); los precios se convierten a MXN al mostrarlos.
create table exchange_rate (
  currency text primary key check (currency in ('USD', 'EUR')),
  mxn_per_unit numeric(12, 6) not null check (mxn_per_unit > 0),
  as_of date not null
);

-- Usuarios y tiendas ---------------------------------------------------------

create table profile (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  kind profile_kind not null default 'player',
  plan text not null default 'free',
  verified boolean not null default false,
  whatsapp text,
  created_at timestamptz not null default now()
);

create table store (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profile (id) on delete cascade,
  name text not null,
  address text,
  whatsapp text,
  -- Referencia de precio declarada por la tienda, p. ej. "SCG −10 %".
  price_reference_note text,
  -- La verificación es manual; solo la service role la escribe.
  verified_at timestamptz,
  inventory_updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Inventario de tiendas y vendedores. El precio lo pone el vendedor en MXN.
create table inventory_item (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profile (id) on delete cascade,
  printing_id uuid not null references card_printing (id),
  condition card_condition not null,
  language text not null default 'en',
  foil boolean not null default false,
  quantity integer not null check (quantity >= 0),
  price_mxn_cents integer not null check (price_mxn_cents >= 0),
  updated_at timestamptz not null default now(),
  unique (seller_id, printing_id, condition, language, foil)
);

create index inventory_item_printing_idx on inventory_item (printing_id);

-- Want lists -----------------------------------------------------------------

create table want_list (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profile (id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index want_list_owner_idx on want_list (owner_id);

create table want_list_item (
  id uuid primary key default gen_random_uuid(),
  want_list_id uuid not null references want_list (id) on delete cascade,
  oracle_id uuid not null,
  -- null = cualquier impresión del mismo oracle id.
  printing_id uuid references card_printing (id),
  quantity integer not null check (quantity > 0),
  min_condition card_condition not null default 'LP',
  foil foil_preference not null default 'any',
  -- null = cualquier idioma.
  language text
);

create index want_list_item_list_idx on want_list_item (want_list_id);
create index want_list_item_oracle_idx on want_list_item (oracle_id);

-- Ofertas y calificaciones ---------------------------------------------------

-- Oferta por un lote de una lista pública. El trato se cierra fuera de la
-- plataforma (WhatsApp o en tienda).
create table offer (
  id uuid primary key default gen_random_uuid(),
  want_list_id uuid not null references want_list (id) on delete cascade,
  seller_id uuid not null references profile (id) on delete cascade,
  total_mxn_cents integer not null check (total_mxn_cents >= 0),
  message text,
  status offer_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index offer_want_list_idx on offer (want_list_id);
create index offer_seller_idx on offer (seller_id);

create table offer_item (
  offer_id uuid not null references offer (id) on delete cascade,
  want_list_item_id uuid not null references want_list_item (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (offer_id, want_list_item_id)
);

create table rating (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references profile (id) on delete cascade,
  to_id uuid not null references profile (id) on delete cascade,
  offer_id uuid not null references offer (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (from_id, offer_id),
  check (from_id <> to_id)
);

create index rating_to_idx on rating (to_id);

-- Perfil automático al registrarse ------------------------------------------

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profile (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS ------------------------------------------------------------------------

alter table card_printing enable row level security;
alter table price_reference enable row level security;
alter table exchange_rate enable row level security;
alter table profile enable row level security;
alter table store enable row level security;
alter table inventory_item enable row level security;
alter table want_list enable row level security;
alter table want_list_item enable row level security;
alter table offer enable row level security;
alter table offer_item enable row level security;
alter table rating enable row level security;

-- Catálogo, precios, perfiles, tiendas, inventario y calificaciones son públicos.
create policy "lectura pública" on card_printing for select using (true);
create policy "lectura pública" on price_reference for select using (true);
create policy "lectura pública" on exchange_rate for select using (true);
create policy "lectura pública" on profile for select using (true);
create policy "lectura pública" on store for select using (true);
create policy "lectura pública" on inventory_item for select using (true);
create policy "lectura pública" on rating for select using (true);

-- Plan y verificación no los puede cambiar el usuario.
create policy "editar mi perfil" on profile for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and plan = (select p.plan from profile p where p.id = auth.uid())
    and verified = (select p.verified from profile p where p.id = auth.uid())
  );

create policy "crear mi tienda" on store for insert
  with check (profile_id = auth.uid() and verified_at is null);
create policy "editar mi tienda" on store for update
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and verified_at is not distinct from (select s.verified_at from store s where s.id = store.id)
  );

create policy "administrar mi inventario" on inventory_item for all
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "ver listas públicas o mías" on want_list for select
  using (is_public or owner_id = auth.uid());
create policy "administrar mis listas" on want_list for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "ver items de listas visibles" on want_list_item for select
  using (exists (
    select 1 from want_list w
    where w.id = want_list_id and (w.is_public or w.owner_id = auth.uid())
  ));
create policy "administrar items de mis listas" on want_list_item for all
  using (exists (select 1 from want_list w where w.id = want_list_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from want_list w where w.id = want_list_id and w.owner_id = auth.uid()));

-- Una oferta la ven el vendedor y el dueño de la lista.
create policy "ver ofertas propias o recibidas" on offer for select
  using (
    seller_id = auth.uid()
    or exists (select 1 from want_list w where w.id = want_list_id and w.owner_id = auth.uid())
  );
create policy "ofertar sobre listas públicas ajenas" on offer for insert
  with check (
    seller_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from want_list w
      where w.id = want_list_id and w.is_public and w.owner_id <> auth.uid()
    )
  );
create policy "actualizar ofertas propias o recibidas" on offer for update
  using (
    seller_id = auth.uid()
    or exists (select 1 from want_list w where w.id = want_list_id and w.owner_id = auth.uid())
  );

create policy "ver items de ofertas visibles" on offer_item for select
  using (exists (select 1 from offer o where o.id = offer_id));
create policy "agregar items a mis ofertas" on offer_item for insert
  with check (exists (
    select 1 from offer o join want_list_item i on i.want_list_id = o.want_list_id
    where o.id = offer_id and o.seller_id = auth.uid() and i.id = want_list_item_id
  ));

-- Solo califica quien participó en la oferta, y a la otra parte.
create policy "calificar a la otra parte" on rating for insert
  with check (
    from_id = auth.uid()
    and exists (
      select 1 from offer o join want_list w on w.id = o.want_list_id
      where o.id = offer_id
        and o.status = 'accepted'
        and (
          (o.seller_id = auth.uid() and w.owner_id = to_id)
          or (w.owner_id = auth.uid() and o.seller_id = to_id)
        )
    )
  );
