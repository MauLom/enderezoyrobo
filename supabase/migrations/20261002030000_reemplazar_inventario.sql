-- Guardar el inventario desde CSV (#9). Reemplaza todo el inventario de quien
-- llama en una sola transacción: subir el mismo archivo dos veces deja lo
-- mismo, y si algo falla no queda a medias. Es security invoker: RLS
-- ("administrar mi inventario", "editar mi tienda") sigue aplicando.
--
-- items: [{printing_id, condition, language, foil, quantity, price_mxn_cents}]
create function reemplazar_inventario(items jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  tipo profile_kind;
  copias integer;
  guardadas integer;
begin
  select kind into tipo from profile where id = auth.uid();
  if tipo is null then
    raise exception 'Inicia sesión para cargar inventario' using errcode = '42501';
  end if;
  if tipo = 'player' then
    raise exception 'Cambia tu cuenta a vendedor para cargar inventario' using errcode = '42501';
  end if;

  -- Plan Vendedor básico (docs/02): hasta 100 cartas sin tienda. Es el mismo
  -- límite que SELLER_CARD_LIMIT en src/lib/catalog/resolve-inventory.ts.
  select coalesce(sum((i ->> 'quantity')::integer), 0) into copias from jsonb_array_elements(items) i;
  if tipo = 'seller' and copias > 100 then
    raise exception 'Tu plan de vendedor permite hasta 100 cartas' using errcode = '23514';
  end if;

  delete from inventory_item where seller_id = auth.uid();

  insert into inventory_item (seller_id, printing_id, condition, language, foil, quantity, price_mxn_cents)
  select auth.uid(), r.printing_id, r.condition, r.language, r.foil, r.quantity, r.price_mxn_cents
  from jsonb_to_recordset(items) as r(
    printing_id uuid, condition card_condition, language text, foil boolean, quantity integer, price_mxn_cents integer
  );
  get diagnostics guardadas = row_count;

  update store set inventory_updated_at = now() where profile_id = auth.uid();
  return guardadas;
end;
$$;

revoke execute on function reemplazar_inventario(jsonb) from public, anon;
grant execute on function reemplazar_inventario(jsonb) to authenticated;
