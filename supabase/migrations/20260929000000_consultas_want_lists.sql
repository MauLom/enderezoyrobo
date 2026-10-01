-- Consultas para las pantallas de want lists. Son security invoker: respetan
-- RLS igual que una consulta directa desde la app.

-- Búsqueda por nombre exacto sin distinguir mayúsculas, también por la cara
-- frontal de cartas de dos caras ("Delver of Secrets" encuentra
-- "Delver of Secrets // Insectile Aberration").
create index card_printing_name_lower_idx on card_printing (lower(name));
create index card_printing_front_name_idx on card_printing (lower(split_part(name, ' // ', 1)));

-- Impresiones en papel cuyo nombre (o cara frontal) coincide con alguno de
-- los nombres dados, ya normalizados a minúsculas.
-- Es la misma normalización que normalizeCardName en src/lib/catalog/resolve.ts.
create function buscar_impresiones(nombres text[])
returns table (
  id uuid,
  oracle_id uuid,
  name text,
  set_code text,
  set_name text,
  collector_number text,
  lang text,
  image_uri text,
  released_at date
)
language sql stable
set search_path = public
as $$
  select p.id, p.oracle_id, p.name, p.set_code, p.set_name, p.collector_number, p.lang, p.image_uri, p.released_at
  from card_printing p
  where lower(p.name) = any (nombres)
     or lower(split_part(p.name, ' // ', 1)) = any (nombres)
  order by p.id; -- orden estable para paginar (PostgREST corta en 1000 filas)
$$;

-- Por cada oracle id: nombre, imagen de la impresión en inglés más reciente y
-- el precio de referencia más bajo (TCGplayer, no foil) entre sus impresiones.
create function resumen_cartas(oracle_ids uuid[])
returns table (oracle_id uuid, name text, image_uri text, set_code text, usd_min numeric, eur_min numeric)
language sql stable
set search_path = public
as $$
  select
    r.oracle_id, r.name, r.image_uri, r.set_code,
    (select min(pr.amount) from price_reference pr join card_printing c on c.id = pr.printing_id
      where c.oracle_id = r.oracle_id and pr.source = 'tcgplayer' and pr.finish = 'nonfoil'),
    (select min(pr.amount) from price_reference pr join card_printing c on c.id = pr.printing_id
      where c.oracle_id = r.oracle_id and pr.source = 'cardmarket' and pr.finish = 'nonfoil')
  from (
    select distinct on (p.oracle_id) p.oracle_id, p.name, p.image_uri, p.set_code
    from card_printing p
    where p.oracle_id = any (oracle_ids)
    order by p.oracle_id, (p.lang = 'en') desc, (p.image_uri is not null) desc, p.released_at desc nulls last
  ) r;
$$;

-- Inventario de todos los vendedores para esos oracle ids, con los datos del
-- vendedor y, si es tienda, de la tienda.
create function inventario_para(oracle_ids uuid[])
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
language sql stable
set search_path = public
as $$
  select
    i.id, i.seller_id, pr.display_name, pr.kind,
    s.name, s.verified_at is not null, s.whatsapp, coalesce(s.inventory_updated_at, i.updated_at),
    c.oracle_id, c.id, c.name, c.set_code, c.collector_number,
    i.condition, i.language, i.foil, i.quantity, i.price_mxn_cents
  from inventory_item i
  join card_printing c on c.id = i.printing_id
  join profile pr on pr.id = i.seller_id
  left join store s on s.profile_id = i.seller_id
  where c.oracle_id = any (oracle_ids) and i.quantity > 0
  order by i.id;
$$;
