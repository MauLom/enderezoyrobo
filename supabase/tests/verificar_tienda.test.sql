-- Verificación desde la línea de comandos (#8). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values ('00000000-0000-4000-8000-000000000a01', 'tienda@verificar.test');
insert into store (id, profile_id, name, address, whatsapp) values
  ('00000000-0000-4000-8000-000000000a11', '00000000-0000-4000-8000-000000000a01', 'Tienda', 'Calle 1, Centro', '+528100000a01');
insert into store_rejection (store_id, reason) values ('00000000-0000-4000-8000-000000000a11', 'Falta la dirección completa');

-- Con sesión nadie la llama, ni la propia tienda.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000a01","role":"authenticated"}', true);
select throws_ok(
  $$select fijar_verificacion('00000000-0000-4000-8000-000000000a11', true)$$,
  '42501', null,
  'una tienda no se verifica con la función interna'
);
reset role;

-- Conexión directa (el script): verifica, borra el rechazo y marca el perfil.
select lives_ok($$select fijar_verificacion('00000000-0000-4000-8000-000000000a11', true)$$, 'el script verifica');
select isnt((select verified_at from store where id = '00000000-0000-4000-8000-000000000a11'), null, 'la tienda queda verificada');
select is(
  (select count(*)::int from store_rejection where store_id = '00000000-0000-4000-8000-000000000a11'),
  0,
  'verificar borra el rechazo'
);

select lives_ok($$select fijar_verificacion('00000000-0000-4000-8000-000000000a11', false)$$, 'el script quita la verificación');
select is(
  (select verified from profile where id = '00000000-0000-4000-8000-000000000a01'),
  false,
  'el perfil deja de estar verificado'
);

select * from finish();
rollback;
