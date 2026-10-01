-- Ofertas sobre listas públicas y bandeja del vendedor. Ver docs/03-mvp.md.
--
-- La bandeja se calcula al momento a partir del inventario (no se guardan
-- "notificaciones"); lo único que se guarda es cuándo la revisó el vendedor por
-- última vez, para marcar lo nuevo.

-- Última vez que el vendedor abrió /vender.
alter table profile add column oportunidades_vistas_at timestamptz;

-- Cuándo el dueño de la lista aceptó o rechazó la oferta (o el vendedor la retiró).
alter table offer add column responded_at timestamptz;

-- Un vendedor solo puede tener una oferta pendiente por lista.
create unique index offer_pendiente_unica_idx on offer (want_list_id, seller_id) where status = 'pending';

-- Cambios de estado permitidos --------------------------------------------------

-- La política de update deja escribir al vendedor y al dueño de la lista; este
-- trigger limita qué puede hacer cada uno: el dueño acepta o rechaza, el
-- vendedor retira, y solo mientras está pendiente. Nadie cambia el monto ni las
-- cartas. Sin usuario (service role, jobs, seed) no se restringe.
create function offer_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  list_owner uuid;
begin
  if uid is null then
    return new;
  end if;
  if new.want_list_id <> old.want_list_id
     or new.seller_id <> old.seller_id
     or new.total_mxn_cents <> old.total_mxn_cents
     or new.message is distinct from old.message
     or new.created_at <> old.created_at then
    raise exception 'Solo se puede cambiar el estado de una oferta';
  end if;
  if new.status = old.status then
    new.responded_at := old.responded_at;
    return new;
  end if;
  if old.status <> 'pending' then
    raise exception 'La oferta ya no está pendiente';
  end if;

  select owner_id into list_owner from want_list where id = new.want_list_id;
  if (new.status in ('accepted', 'rejected') and uid = list_owner)
     or (new.status = 'withdrawn' and uid = new.seller_id) then
    new.responded_at := now();
    return new;
  end if;
  raise exception 'No puedes cambiar esta oferta a %', new.status;
end;
$$;

create trigger offer_guard
  before update on offer
  for each row execute function offer_guard();

-- Crear una oferta ----------------------------------------------------------------

-- Crea la oferta y sus cartas en una sola transacción. Security invoker: las
-- políticas de offer y offer_item deciden si se puede (lista pública, ajena, y
-- cartas de esa lista). `items` es un arreglo de {want_list_item_id, quantity}.
create function crear_oferta(lista uuid, total integer, mensaje text, items jsonb)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  oferta uuid;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'La oferta necesita al menos una carta';
  end if;

  insert into offer (want_list_id, seller_id, total_mxn_cents, message)
  values (lista, auth.uid(), total, nullif(btrim(mensaje), ''))
  returning id into oferta;

  insert into offer_item (offer_id, want_list_item_id, quantity)
  select oferta, (e ->> 'want_list_item_id')::uuid, (e ->> 'quantity')::integer
  from jsonb_array_elements(items) e;

  if exists (
    select 1 from offer_item oi join want_list_item w on w.id = oi.want_list_item_id
    where oi.offer_id = oferta and oi.quantity > w.quantity
  ) then
    raise exception 'La oferta incluye más copias de las que pide la lista';
  end if;

  return oferta;
end;
$$;

-- Bandeja del vendedor --------------------------------------------------------------

-- ¿El renglón de inventario `i` sirve para el item `w` de una want list? Es la
-- misma regla que matchesWant en src/lib/matching/match.ts. El enum
-- card_condition va de mejor a peor (NM < LP < …), así que "igual o mejor" es <=.
create function inventario_cumple(w want_list_item, i inventory_item, i_oracle_id uuid)
returns boolean
language sql immutable
set search_path = public
as $$
  select i.quantity > 0
    and case when w.printing_id is not null then i.printing_id = w.printing_id else i_oracle_id = w.oracle_id end
    and i.condition <= w.min_condition
    and (w.foil = 'any' or (w.foil = 'yes') = i.foil)
    and (w.language is null or i.language = w.language);
$$;

-- Todas las cartas de las listas públicas ajenas donde el inventario del
-- usuario cubre al menos una carta. El reparto y la cobertura se calculan en
-- la app con el mismo matching que ve el comprador.
create function oportunidades()
returns table (
  want_list_id uuid,
  list_name text,
  owner_name text,
  list_updated_at timestamptz,
  item_id uuid,
  oracle_id uuid,
  printing_id uuid,
  quantity integer,
  min_condition card_condition,
  foil foil_preference,
  language text
)
language sql stable security invoker
set search_path = public
as $$
  with listas as (
    select distinct w.id
    from want_list w
    join want_list_item wi on wi.want_list_id = w.id
    where w.is_public
      and w.owner_id <> auth.uid()
      and exists (
        select 1 from inventory_item i join card_printing c on c.id = i.printing_id
        where i.seller_id = auth.uid() and c.oracle_id = wi.oracle_id and inventario_cumple(wi, i, c.oracle_id)
      )
  )
  select w.id, w.name, p.display_name, w.updated_at,
         wi.id, wi.oracle_id, wi.printing_id, wi.quantity, wi.min_condition, wi.foil, wi.language
  from listas l
  join want_list w on w.id = l.id
  join profile p on p.id = w.owner_id
  join want_list_item wi on wi.want_list_id = w.id
  order by wi.id;
$$;

-- Inventario del usuario para esos oracle ids, con las mismas columnas que inventario_para.
create function mi_inventario_para(oracle_ids uuid[])
returns table (
  id uuid,
  seller_id uuid,
  seller_name text,
  seller_kind profile_kind,
  store_name text,
  store_verified boolean,
  store_whatsapp text,
  inventory_updated_at timestamptz,
  oracle_id uuid,
  printing_id uuid,
  card_name text,
  set_code text,
  collector_number text,
  condition card_condition,
  language text,
  foil boolean,
  quantity integer,
  price_mxn_cents integer
)
language sql stable security invoker
set search_path = public
as $$
  select * from inventario_para(oracle_ids) f where f.seller_id = auth.uid();
$$;

-- Lo que el encabezado marca como nuevo para el vendedor: listas que puede
-- surtir, actualizadas desde su última visita y sin oferta suya; y respuestas
-- a sus ofertas desde su última visita.
create function avisos_vendedor()
returns table (listas_nuevas integer, respuestas integer)
language sql stable security invoker
set search_path = public
as $$
  with visto as (
    select coalesce(oportunidades_vistas_at, '-infinity'::timestamptz) as at
    from profile where id = auth.uid()
  )
  select
    (select count(distinct o.want_list_id)::integer
       from oportunidades() o, visto
      where o.list_updated_at > visto.at
        and not exists (select 1 from offer f where f.want_list_id = o.want_list_id and f.seller_id = auth.uid())),
    (select count(*)::integer
       from offer f, visto
      where f.seller_id = auth.uid() and f.status in ('accepted', 'rejected') and f.responded_at > visto.at);
$$;
