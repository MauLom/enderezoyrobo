-- Hacer oferta por el lote de una lista pública (#23). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- Dueña (d) con una lista pública y una privada; vendedor (v).
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000101', 'duena@oferta.test'),
  ('00000000-0000-4000-8000-000000000102', 'vendedor@oferta.test');
update profile set kind = 'seller' where id = '00000000-0000-4000-8000-000000000102';
insert into want_list (id, owner_id, name, is_public) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', 'Pública', true),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101', 'Privada', false);
-- oracle_id no tiene llave foránea: la prueba no depende del catálogo.
insert into want_list_item (id, want_list_id, oracle_id, quantity) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000401', 4),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000401', 1);

set local role authenticated;

-- Vendedor.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated"}', true);
select lives_ok(
  $$select crear_oferta('00000000-0000-4000-8000-000000000201', 12000, 'Te dejo las 4',
    '[{"want_list_item_id":"00000000-0000-4000-8000-000000000301","quantity":4}]')$$,
  'un vendedor oferta sobre una lista pública ajena'
);
select throws_ok(
  $$select crear_oferta('00000000-0000-4000-8000-000000000201', 9000, '',
    '[{"want_list_item_id":"00000000-0000-4000-8000-000000000301","quantity":2}]')$$,
  '23505', null,
  'solo una oferta pendiente por lista'
);
select throws_ok(
  $$select crear_oferta('00000000-0000-4000-8000-000000000202', 1000, '',
    '[{"want_list_item_id":"00000000-0000-4000-8000-000000000302","quantity":1}]')$$,
  '42501', null,
  'no se oferta sobre una lista privada'
);

-- Dueña.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated"}', true);
select throws_ok(
  $$select crear_oferta('00000000-0000-4000-8000-000000000201', 1000, '',
    '[{"want_list_item_id":"00000000-0000-4000-8000-000000000301","quantity":1}]')$$,
  '42501', null,
  'la dueña no puede ofertar sobre su propia lista'
);
select results_eq(
  'select total_mxn_cents, status::text, message from offer',
  $$values (12000, 'pending', 'Te dejo las 4')$$,
  'la dueña ve la oferta recibida, pendiente'
);
select is(
  (select sum(quantity)::int from offer_item),
  4,
  'con sus cartas'
);

select * from finish();
rollback;
