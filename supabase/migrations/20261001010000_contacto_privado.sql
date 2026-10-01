-- WhatsApp privado (#2, decisión B de #1). El número de jugadores y vendedores
-- sale de profile, que es de lectura pública, a contact: solo lo lee y edita
-- su dueño. La contraparte de una oferta aceptada lo obtiene con
-- whatsapp_de_oferta. store.whatsapp sigue público (es de la tienda).
create table contact (
  profile_id uuid primary key references profile (id) on delete cascade,
  whatsapp text not null,
  updated_at timestamptz not null default now()
);

insert into contact (profile_id, whatsapp)
select id, whatsapp from profile where nullif(trim(whatsapp), '') is not null;

alter table profile drop column whatsapp;

alter table contact enable row level security;

create policy "administrar mi contacto" on contact for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- WhatsApp de la otra parte de una oferta aceptada: el vendedor obtiene el del
-- dueño de la lista y viceversa. Null si la oferta no es del usuario, no está
-- aceptada o la otra parte no guardó número.
create function whatsapp_de_oferta(p_offer_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select c.whatsapp
  from offer o
  join want_list w on w.id = o.want_list_id
  join contact c on c.profile_id = case when o.seller_id = auth.uid() then w.owner_id else o.seller_id end
  where o.id = p_offer_id
    and o.status = 'accepted'
    and auth.uid() in (o.seller_id, w.owner_id);
$$;

revoke execute on function whatsapp_de_oferta(uuid) from public, anon;
grant execute on function whatsapp_de_oferta(uuid) to authenticated;
