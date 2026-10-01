-- Política "editar mi perfil" y el tipo de cuenta (#4). Corre con npm run db:test.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'jugador@tipo.test'),
  ('00000000-0000-4000-8000-0000000000a2', 'tienda@tipo.test');
update profile set kind = 'store' where id = '00000000-0000-4000-8000-0000000000a2';

set local role authenticated;

-- Jugador.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$update profile set kind = 'seller' where id = auth.uid()$$,
  'un jugador se vuelve vendedor'
);
select is((select kind from profile where id = auth.uid()), 'seller'::profile_kind, 'quedó como vendedor');

select lives_ok(
  $$update profile set kind = 'player' where id = auth.uid()$$,
  'un vendedor vuelve a jugador'
);

select throws_ok(
  $$update profile set kind = 'store' where id = auth.uid()$$,
  '42501', null,
  'nadie se vuelve tienda sin registrarla'
);

-- Tienda.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);

select throws_ok(
  $$update profile set kind = 'player' where id = auth.uid()$$,
  '42501', null,
  'una tienda no deja de serlo desde su perfil'
);
select lives_ok(
  $$update profile set display_name = 'Tienda renombrada' where id = auth.uid()$$,
  'una tienda sí edita su nombre'
);

select * from finish();
rollback;
