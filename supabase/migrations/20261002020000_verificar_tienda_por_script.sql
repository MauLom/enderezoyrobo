-- Verificación desde la línea de comandos (#8). npm run tienda:verificar se
-- conecta directo a Postgres, sin sesión, así que no puede usar
-- verificar_tienda ni quitar_verificacion (exigen staff). La lógica pasa a
-- fijar_verificacion, que solo ejecuta la conexión directa, y las funciones
-- del staff la llaman después de revisar el rol.

create function fijar_verificacion(tienda uuid, verificada boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  dueno uuid;
begin
  update store set verified_at = case when verificada then coalesce(verified_at, now()) end
  where id = tienda
  returning profile_id into dueno;
  if dueno is null then raise exception 'La tienda no existe'; end if;
  -- profile.verified se mantiene igual que store.verified_at.
  update profile set verified = verificada where id = dueno;
  if verificada then
    delete from store_rejection where store_id = tienda;
  end if;
end;
$$;

revoke execute on function fijar_verificacion(uuid, boolean) from public, anon, authenticated;

create or replace function verificar_tienda(tienda uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir_staff();
  perform fijar_verificacion(tienda, true);
end;
$$;

create or replace function quitar_verificacion(tienda uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir_staff();
  perform fijar_verificacion(tienda, false);
end;
$$;
