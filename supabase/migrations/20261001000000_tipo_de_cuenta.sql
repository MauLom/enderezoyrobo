-- Tipo de cuenta (#4). El usuario cambia entre jugador y vendedor desde
-- /cuenta, pero no puede ponerse 'store' por su cuenta: eso solo pasa al
-- registrar una tienda (#6), que lo hará con un trigger security definer.
-- Una tienda tampoco deja de serlo desde su perfil.
drop policy "editar mi perfil" on profile;

create policy "editar mi perfil" on profile for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and plan = (select p.plan from profile p where p.id = auth.uid())
    and verified = (select p.verified from profile p where p.id = auth.uid())
    and (
      kind = (select p.kind from profile p where p.id = auth.uid())
      or (
        kind in ('player', 'seller')
        and (select p.kind from profile p where p.id = auth.uid()) in ('player', 'seller')
      )
    )
  );
