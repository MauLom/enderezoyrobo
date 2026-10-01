-- WhatsApp de vendedores particulares en marketplace y matching (#5). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

-- Vendedor (v) con oferta aceptada sobre la lista de un jugador (j); un tercero (t) con oferta pendiente.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000e1', 'vendedor@tratos.test'),
  ('00000000-0000-4000-8000-0000000000e2', 'jugador@tratos.test'),
  ('00000000-0000-4000-8000-0000000000e3', 'tercero@tratos.test');
insert into contact (profile_id, whatsapp) values
  ('00000000-0000-4000-8000-0000000000e1', '+528100000201'),
  ('00000000-0000-4000-8000-0000000000e2', '+528100000202'),
  ('00000000-0000-4000-8000-0000000000e3', '+528100000203');
insert into want_list (id, owner_id, name, is_public) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e2', 'Lista', true);
insert into offer (want_list_id, seller_id, total_mxn_cents, status) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e1', 100, 'accepted'),
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e1', 200, 'accepted'),
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e3', 100, 'pending');

set local role anon;
select throws_ok('select * from whatsapp_de_mis_tratos()', '42501', null, 'sin sesión no se puede llamar');

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e2","role":"authenticated"}', true);
select results_eq(
  'select profile_id, whatsapp from whatsapp_de_mis_tratos()',
  $$values ('00000000-0000-4000-8000-0000000000e1'::uuid, '+528100000201')$$,
  'el jugador obtiene una vez el del vendedor con ofertas aceptadas, no el del que tiene una pendiente'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
select results_eq(
  'select profile_id, whatsapp from whatsapp_de_mis_tratos()',
  $$values ('00000000-0000-4000-8000-0000000000e2'::uuid, '+528100000202')$$,
  'el vendedor obtiene el del jugador'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e3","role":"authenticated"}', true);
select is_empty('select * from whatsapp_de_mis_tratos()', 'con oferta pendiente no se obtiene nada');

-- El dueño de la lista acepta la oferta pendiente; ya aparece.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e2","role":"authenticated"}', true);
update offer set status = 'accepted' where seller_id = '00000000-0000-4000-8000-0000000000e3';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e3","role":"authenticated"}', true);
select results_eq(
  'select whatsapp from whatsapp_de_mis_tratos()',
  $$values ('+528100000202')$$,
  'al aceptarse, el tercero obtiene el del jugador'
);

select * from finish();
rollback;
