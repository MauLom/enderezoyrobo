-- Registro de tienda (#6) y revisión por el staff. Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Un jugador que registra su tienda (t), un moderador (m) y un tercero (x).
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000801', 'tienda@registro.test'),
  ('00000000-0000-4000-8000-000000000802', 'moderador@registro.test'),
  ('00000000-0000-4000-8000-000000000803', 'tercero@registro.test');
insert into staff (profile_id, role) values ('00000000-0000-4000-8000-000000000802', 'moderator');

set local role authenticated;

-- Tienda: registra, no se verifica sola, no se da de alta como staff.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000801","role":"authenticated"}', true);

select throws_ok(
  $$insert into store (profile_id, name, address, whatsapp, verified_at)
    values (auth.uid(), 'Tienda', 'Calle 1, Centro', '+528100000801', now())$$,
  '42501', null,
  'no se registra ya verificada'
);
select lives_ok(
  $$insert into store (id, profile_id, name, address, whatsapp, price_reference_note)
    values ('00000000-0000-4000-8000-000000000901', auth.uid(), 'Tienda', 'Calle 1, Centro', '+528100000801', 'SCG −10 %')$$,
  'registra su tienda pendiente'
);
select is((select kind from profile where id = auth.uid()), 'store'::profile_kind, 'el perfil pasa a tienda');
select throws_ok(
  $$update store set verified_at = now() where profile_id = auth.uid()$$,
  '42501', null,
  'no se marca verificada a sí misma'
);
select throws_ok(
  $$select verificar_tienda('00000000-0000-4000-8000-000000000901')$$,
  '42501', null,
  'tampoco con la función del staff'
);
select throws_ok(
  $$insert into staff (profile_id, role) values (auth.uid(), 'owner')$$,
  '42501', null,
  'no se da de alta como staff'
);
select is(es_staff(), false, 'no es staff');
select throws_ok($$select * from tiendas_para_revisar()$$, '42501', null, 'no ve la lista de revisión');

-- Moderador: ve la lista, rechaza con motivo.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000802","role":"authenticated"}', true);

select is(
  (select owner_email from tiendas_para_revisar() where id = '00000000-0000-4000-8000-000000000901'),
  'tienda@registro.test',
  'el staff ve la tienda con el correo de la cuenta'
);
select lives_ok(
  $$select rechazar_tienda('00000000-0000-4000-8000-000000000901', 'No encontramos la tienda en esa dirección')$$,
  'el moderador rechaza con motivo'
);

-- El motivo lo ve la tienda, no un tercero.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000803","role":"authenticated"}', true);
select is((select count(*)::int from store_rejection), 0, 'un tercero no ve el motivo');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000801","role":"authenticated"}', true);
select is(
  (select reason from store_rejection where store_id = '00000000-0000-4000-8000-000000000901'),
  'No encontramos la tienda en esa dirección',
  'la tienda ve su motivo'
);
select lives_ok(
  $$update store set address = 'Calle 2, Centro' where profile_id = auth.uid()$$,
  'la tienda corrige su dirección'
);
select is((select count(*)::int from store_rejection), 0, 'corregir la manda otra vez a revisión');

-- Moderador: verifica y quita la verificación.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000802","role":"authenticated"}', true);
select lives_ok($$select verificar_tienda('00000000-0000-4000-8000-000000000901')$$, 'el moderador verifica');
select is(
  (select verified from profile where id = '00000000-0000-4000-8000-000000000801'),
  true,
  'el perfil queda verificado junto con la tienda'
);
select lives_ok($$select quitar_verificacion('00000000-0000-4000-8000-000000000901')$$, 'el moderador quita la verificación');

select * from finish();
rollback;
