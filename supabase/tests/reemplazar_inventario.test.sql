-- Guardar el inventario desde CSV (#9). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Tienda (t), vendedor sin tienda (v) y jugador (j). Dos impresiones cualesquiera del catálogo de prueba.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000b01', 'tienda@inventario.test'),
  ('00000000-0000-4000-8000-000000000b02', 'vendedor@inventario.test'),
  ('00000000-0000-4000-8000-000000000b03', 'jugador@inventario.test');
insert into store (profile_id, name, address, whatsapp, inventory_updated_at) values
  ('00000000-0000-4000-8000-000000000b01', 'Tienda', 'Calle 1, Centro', '+528100000b01', now() - interval '40 days');
update profile set kind = 'seller' where id = '00000000-0000-4000-8000-000000000b02';
insert into card_printing (id, oracle_id, name, set_code, set_name, collector_number, lang, rarity) values
  ('00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000c11', 'Carta Uno', 'tst', 'Prueba', '1', 'en', 'common'),
  ('00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000c12', 'Carta Dos', 'tst', 'Prueba', '2', 'en', 'common')
on conflict do nothing;

set local role authenticated;

-- Tienda: reemplaza su inventario; repetir el mismo archivo deja lo mismo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000b01","role":"authenticated"}', true);
create temp table archivo as select $$[
  {"printing_id":"00000000-0000-4000-8000-000000000c01","condition":"NM","language":"en","foil":false,"quantity":3,"price_mxn_cents":4500},
  {"printing_id":"00000000-0000-4000-8000-000000000c02","condition":"LP","language":"es","foil":true,"quantity":1,"price_mxn_cents":9000}
]$$::jsonb as items;

select is(reemplazar_inventario((select items from archivo)), 2, 'guarda dos renglones');
select is(reemplazar_inventario((select items from archivo)), 2, 'subirlo otra vez también');
select is((select count(*)::int from inventory_item where seller_id = auth.uid()), 2, 'el mismo archivo deja el mismo inventario');
select ok(
  (select inventory_updated_at > now() - interval '1 minute' from store where profile_id = auth.uid()),
  'actualiza la fecha de inventario de la tienda'
);

select is(
  reemplazar_inventario($$[{"printing_id":"00000000-0000-4000-8000-000000000c01","condition":"NM","language":"en","foil":false,"quantity":5,"price_mxn_cents":4000}]$$::jsonb),
  1,
  'un archivo nuevo reemplaza todo'
);
select is((select quantity from inventory_item where seller_id = auth.uid()), 5, 'quedan solo las cartas del archivo nuevo');

-- Un renglón inválido (impresión que no existe) no deja nada a medias.
select throws_ok(
  $$select reemplazar_inventario('[{"printing_id":"00000000-0000-4000-8000-000000000c02","condition":"NM","language":"en","foil":false,"quantity":1,"price_mxn_cents":100},
    {"printing_id":"00000000-0000-4000-8000-0000000000ff","condition":"NM","language":"en","foil":false,"quantity":1,"price_mxn_cents":100}]'::jsonb)$$,
  '23503', null,
  'una impresión inexistente hace fallar todo'
);
select is((select quantity from inventory_item where seller_id = auth.uid()), 5, 'y el inventario anterior sigue igual');

-- Vendedor sin tienda: hasta 100 cartas.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000b02","role":"authenticated"}', true);
select throws_ok(
  $$select reemplazar_inventario('[{"printing_id":"00000000-0000-4000-8000-000000000c01","condition":"NM","language":"en","foil":false,"quantity":101,"price_mxn_cents":100}]'::jsonb)$$,
  '23514', null,
  'un vendedor no pasa de 100 cartas'
);

-- Jugador: no carga inventario.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000b03","role":"authenticated"}', true);
select throws_ok($$select reemplazar_inventario('[]'::jsonb)$$, '42501', null, 'un jugador no carga inventario');

select * from finish();
rollback;
