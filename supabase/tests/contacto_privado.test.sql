-- WhatsApp privado (#2, decisión B de #1). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Vendedor (v) con oferta aceptada sobre la lista de un jugador (j); un tercero (t) sin relación.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000b1', 'vendedor@contacto.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'jugador@contacto.test'),
  ('00000000-0000-4000-8000-0000000000b3', 'tercero@contacto.test');
insert into contact (profile_id, whatsapp) values
  ('00000000-0000-4000-8000-0000000000b1', '+528100000101'),
  ('00000000-0000-4000-8000-0000000000b2', '+528100000102');
insert into store (profile_id, name, whatsapp) values
  ('00000000-0000-4000-8000-0000000000b3', 'Tienda', '+528100000103');
insert into want_list (id, owner_id, name, is_public) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b2', 'Lista', true);
insert into offer (id, want_list_id, seller_id, total_mxn_cents, status) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b1', 100, 'accepted'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b3', 100, 'pending');

-- Sin sesión (llave publicable).
set local role anon;
select is((select count(*) from contact)::int, 0, 'sin sesión no se lee ningún WhatsApp');
select is(
  (select whatsapp from store where profile_id = '00000000-0000-4000-8000-0000000000b3'), '+528100000103',
  'el WhatsApp de una tienda siempre es público'
);
select throws_ok(
  $$select whatsapp_de_oferta('00000000-0000-4000-8000-0000000000d1')$$,
  '42501', null,
  'sin sesión no se puede pedir el WhatsApp de una oferta'
);

set local role authenticated;

-- Jugador: ve solo el suyo y, por la oferta aceptada, el del vendedor.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
select results_eq('select whatsapp from contact', $$values ('+528100000102')$$, 'el jugador solo lee su propio contacto');
select is(whatsapp_de_oferta('00000000-0000-4000-8000-0000000000d1'), '+528100000101', 'oferta aceptada: el jugador obtiene el del vendedor');
select is(whatsapp_de_oferta('00000000-0000-4000-8000-0000000000d2'), null, 'oferta pendiente: no revela nada');
select lives_ok(
  $$update contact set whatsapp = '+528100000199' where profile_id = auth.uid()$$,
  'el dueño edita su número'
);
select is((select whatsapp from contact), '+528100000199', 'el cambio quedó guardado');

-- Vendedor: obtiene el del jugador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select is(whatsapp_de_oferta('00000000-0000-4000-8000-0000000000d1'), '+528100000199', 'oferta aceptada: el vendedor obtiene el del jugador');

-- Tercero: ni lee contactos ajenos ni puede escribir uno a nombre de otro.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b3","role":"authenticated"}', true);
select is(whatsapp_de_oferta('00000000-0000-4000-8000-0000000000d1'), null, 'quien no es parte de la oferta no obtiene nada');
select throws_ok(
  $$insert into contact (profile_id, whatsapp) values ('00000000-0000-4000-8000-0000000000b1', '+520000000000')$$,
  '42501', null,
  'nadie guarda un número a nombre de otro'
);

select * from finish();
rollback;
