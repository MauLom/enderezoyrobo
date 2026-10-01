-- Contacto con vendedores particulares (#5, decisión B de #1). WhatsApp de
-- todas las personas con las que el usuario tiene una oferta aceptada (como
-- vendedor o como dueño de la lista), para mostrarlo en marketplace y
-- matching. Misma regla que whatsapp_de_oferta, en una sola consulta.
create function whatsapp_de_mis_tratos() returns table (profile_id uuid, whatsapp text)
language sql stable security definer set search_path = public as $$
  select distinct on (c.profile_id) c.profile_id, c.whatsapp
  from offer o
  join want_list w on w.id = o.want_list_id
  join contact c on c.profile_id = case when o.seller_id = auth.uid() then w.owner_id else o.seller_id end
  where o.status = 'accepted'
    and auth.uid() in (o.seller_id, w.owner_id);
$$;

revoke execute on function whatsapp_de_mis_tratos() from public, anon;
grant execute on function whatsapp_de_mis_tratos() to authenticated;
