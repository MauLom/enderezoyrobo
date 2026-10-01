-- Crea el profile de usuarios que se registraron antes de que existiera el
-- trigger handle_new_user (p. ej., al probar el login en un proyecto sin el
-- esquema). Mismo valor por defecto que el trigger.
insert into public.profile (id, display_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profile p where p.id = u.id);
