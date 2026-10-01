-- Zona de entrega (#3): municipio del área metropolitana donde el usuario
-- prefiere cerrar tratos. Es pública (no es una dirección); la lista de
-- municipios válidos vive en src/lib/account/validation.ts.
alter table profile add column delivery_zone text check (char_length(delivery_zone) <= 60);
