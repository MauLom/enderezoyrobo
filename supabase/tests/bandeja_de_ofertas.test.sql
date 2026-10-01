-- Bandeja de ofertas: aceptar, rechazar, retirar y calificar (#24). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Dueña (d) de una lista pública; vendedor (v) con tres ofertas pendientes.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000501', 'duena@bandeja.test'),
  ('00000000-0000-4000-8000-000000000502', 'vendedor@bandeja.test');
insert into want_list (id, owner_id, name, is_public) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000501', 'Lista', true),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000501', 'Otra', true),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000501', 'Tercera', true);
insert into offer (id, want_list_id, seller_id, total_mxn_cents) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000502', 100),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000502', 100),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000502', 100);

set local role authenticated;

-- Vendedor: no puede aceptar su propia oferta, sí retirarla.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000502","role":"authenticated"}', true);
select throws_ok(
  $$update offer set status = 'accepted' where id = '00000000-0000-4000-8000-000000000701'$$,
  'P0001', null,
  'el vendedor no acepta su propia oferta'
);
select lives_ok(
  $$update offer set status = 'withdrawn' where id = '00000000-0000-4000-8000-000000000703'$$,
  'el vendedor retira una oferta pendiente'
);

-- Dueña: acepta una, rechaza otra; no puede retirar ni cambiar una que ya no está pendiente.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000501","role":"authenticated"}', true);
select lives_ok(
  $$update offer set status = 'accepted' where id = '00000000-0000-4000-8000-000000000701'$$,
  'la dueña acepta'
);
select lives_ok(
  $$update offer set status = 'rejected' where id = '00000000-0000-4000-8000-000000000702'$$,
  'la dueña rechaza'
);
select throws_ok(
  $$update offer set status = 'rejected' where id = '00000000-0000-4000-8000-000000000701'$$,
  'P0001', null,
  'una oferta aceptada ya no cambia'
);
select isnt((select responded_at from offer where id = '00000000-0000-4000-8000-000000000701'), null, 'se guarda cuándo respondió');

-- Calificar: solo ofertas aceptadas, a la otra parte y una vez.
select lives_ok(
  $$insert into rating (from_id, to_id, offer_id, score) values
    ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000701', 5)$$,
  'la dueña califica al vendedor de una oferta aceptada'
);
select throws_ok(
  $$insert into rating (from_id, to_id, offer_id, score) values
    ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000701', 4)$$,
  '23505', null,
  'solo una calificación por oferta'
);
select throws_ok(
  $$insert into rating (from_id, to_id, offer_id, score) values
    ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000702', 1)$$,
  '42501', null,
  'una oferta rechazada no se califica'
);

select * from finish();
rollback;
