-- Precio de Card Kingdom (#19): resumen_cartas devuelve también el más bajo de
-- CK (USD, no foil) entre las impresiones de cada carta. Cambia el tipo que
-- regresa, así que hay que borrarla y volver a crearla.
drop function resumen_cartas(uuid[]);

create function resumen_cartas(oracle_ids uuid[])
returns table (oracle_id uuid, name text, image_uri text, set_code text, usd_min numeric, eur_min numeric, ck_min numeric)
language sql stable
set search_path = public
as $$
  select
    r.oracle_id, r.name, r.image_uri, r.set_code,
    (select min(pr.amount) from price_reference pr join card_printing c on c.id = pr.printing_id
      where c.oracle_id = r.oracle_id and pr.source = 'tcgplayer' and pr.finish = 'nonfoil'),
    (select min(pr.amount) from price_reference pr join card_printing c on c.id = pr.printing_id
      where c.oracle_id = r.oracle_id and pr.source = 'cardmarket' and pr.finish = 'nonfoil'),
    (select min(pr.amount) from price_reference pr join card_printing c on c.id = pr.printing_id
      where c.oracle_id = r.oracle_id and pr.source = 'ck' and pr.finish = 'nonfoil')
  from (
    select distinct on (p.oracle_id) p.oracle_id, p.name, p.image_uri, p.set_code
    from card_printing p
    where p.oracle_id = any (oracle_ids)
    order by p.oracle_id, (p.lang = 'en') desc, (p.image_uri is not null) desc, p.released_at desc nulls last
  ) r;
$$;
