-- Registro de tienda (#6) y su revisión por owners y moderadores.
--
-- Cualquier usuario registra su tienda desde /cuenta ("crear mi tienda" ya
-- existe y exige verified_at null); al hacerlo su perfil pasa a 'store'. La
-- tienda queda pendiente hasta que alguien del staff la verifica o la rechaza
-- con un motivo desde /tiendas. Si la tienda corrige sus datos, el rechazo se
-- borra y vuelve a quedar pendiente.

-- Staff ----------------------------------------------------------------------

-- Owners y moderadores de la plataforma. No hay política de escritura: se dan
-- de alta con npm run staff (conexión directa), para que ningún correo quede
-- en el repositorio.
create table staff (
  profile_id uuid primary key references profile (id) on delete cascade,
  role text not null check (role in ('owner', 'moderator')),
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

create policy "ver mi rol" on staff for select using (profile_id = auth.uid());

create function es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where profile_id = auth.uid());
$$;

-- Tienda ---------------------------------------------------------------------

alter table store
  add constraint store_name_check check (char_length(name) between 2 and 60),
  add constraint store_address_check check (char_length(address) <= 160),
  add constraint store_price_reference_note_check check (char_length(price_reference_note) <= 60);

-- Rechazo vigente de una tienda. Va aparte porque store es de lectura pública
-- y el motivo solo lo ven la tienda y el staff.
create table store_rejection (
  store_id uuid primary key references store (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  rejected_by uuid references profile (id) on delete set null,
  rejected_at timestamptz not null default now()
);

alter table store_rejection enable row level security;

create policy "la tienda o el staff" on store_rejection for select
  using (es_staff() or exists (select 1 from store s where s.id = store_id and s.profile_id = auth.uid()));

-- Al registrar la tienda el perfil pasa a 'store'. El usuario no puede hacerlo
-- por su cuenta (política "editar mi perfil").
create function al_registrar_tienda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profile set kind = 'store' where id = new.profile_id;
  return new;
end;
$$;

create trigger al_registrar_tienda after insert on store
  for each row execute function al_registrar_tienda();

-- Corregir los datos después de un rechazo manda la tienda otra vez a revisión.
create function al_editar_tienda() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.name, new.address, new.whatsapp, new.price_reference_note)
     is distinct from (old.name, old.address, old.whatsapp, old.price_reference_note) then
    delete from store_rejection where store_id = new.id;
  end if;
  return new;
end;
$$;

create trigger al_editar_tienda after update on store
  for each row execute function al_editar_tienda();

-- Revisión (solo staff) ------------------------------------------------------

create function exigir_staff() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_staff() then
    raise exception 'Solo owners y moderadores revisan tiendas' using errcode = '42501';
  end if;
end;
$$;

-- Insignia de verificada. profile.verified se mantiene igual que store.verified_at.
create function verificar_tienda(tienda uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  dueno uuid;
begin
  perform exigir_staff();
  update store set verified_at = coalesce(verified_at, now()) where id = tienda returning profile_id into dueno;
  if dueno is null then raise exception 'La tienda no existe'; end if;
  delete from store_rejection where store_id = tienda;
  update profile set verified = true where id = dueno;
end;
$$;

create function quitar_verificacion(tienda uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  dueno uuid;
begin
  perform exigir_staff();
  update store set verified_at = null where id = tienda returning profile_id into dueno;
  if dueno is null then raise exception 'La tienda no existe'; end if;
  update profile set verified = false where id = dueno;
end;
$$;

-- Rechazar también quita la verificación, si la tenía.
create function rechazar_tienda(tienda uuid, motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  dueno uuid;
begin
  perform exigir_staff();
  update store set verified_at = null where id = tienda returning profile_id into dueno;
  if dueno is null then raise exception 'La tienda no existe'; end if;
  update profile set verified = false where id = dueno;
  insert into store_rejection (store_id, reason, rejected_by) values (tienda, trim(motivo), auth.uid())
  on conflict (store_id) do update
    set reason = excluded.reason, rejected_by = excluded.rejected_by, rejected_at = now();
end;
$$;

-- Todas las tiendas con lo que el staff necesita para revisarlas, incluido el
-- correo de la cuenta (no es público).
create function tiendas_para_revisar()
returns table (
  id uuid,
  name text,
  address text,
  whatsapp text,
  price_reference_note text,
  created_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  owner_name text,
  owner_email text,
  inventory_count integer
)
language plpgsql stable security definer set search_path = public as $$
begin
  perform exigir_staff();
  return query
    select s.id, s.name, s.address, s.whatsapp, s.price_reference_note, s.created_at, s.verified_at,
           r.rejected_at, r.reason, p.display_name, u.email::text,
           (select count(*)::int from inventory_item i where i.seller_id = s.profile_id)
    from store s
    join profile p on p.id = s.profile_id
    join auth.users u on u.id = s.profile_id
    left join store_rejection r on r.store_id = s.id
    order by s.created_at desc;
end;
$$;

-- es_staff() queda abierta a anon: la usa la política de store_rejection y sin sesión devuelve false.
revoke execute on function exigir_staff(), verificar_tienda(uuid), quitar_verificacion(uuid),
  rechazar_tienda(uuid, text), tiendas_para_revisar() from public, anon;
grant execute on function exigir_staff(), verificar_tienda(uuid), quitar_verificacion(uuid),
  rechazar_tienda(uuid, text), tiendas_para_revisar() to authenticated;
