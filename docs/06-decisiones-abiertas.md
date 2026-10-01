# Decisiones abiertas

## Nombre

"Mazo" es el favorito, pero `mazo.mx` parece ocupado. "MazoTCG" es solo el nombre de trabajo de esta carpeta.

Otros candidatos (disponibilidad revisada con `whois` el 2026-09-28, sin confirmar con un registrador):

| Nombre | Idea | Dominio que parecía libre |
| --- | --- | --- |
| Cartapacio | Palabra vieja para carpeta/portafolio (la *binder*); sirve para cualquier TCG | `cartapacio.mx` |
| Carta Regia | Juego de palabras con *regio* (Monterrey); amarra la marca a la ciudad | `cartaregia.mx` |
| La Carpeta | "¿Qué traes en la carpeta?" | `lacarpeta.gg`, `carpetatcg.com` |
| Sobre | El booster, común a todos los TCGs | `sobre.gg` |
| Cartero | "Carta" + quien te trae las ofertas | `cartero.gg`, `carteromx.com` |
| Mazo | Término universal | `mazo.gg` |

`enderezoyrobo.com` estaba libre: buena opción para blog o comunidad de Magic, no para la plataforma (no sirve para otros TCGs). Nota: `.mx` cuesta ~$20–30 USD/año y `.gg` ~$60–80 USD/año (aproximado).

## Oferta de lanzamiento para tiendas

- Opción A: plan Tienda gratis 3 meses, luego $199 MXN/mes de por vida.
- Opción B: cobrar desde el mes 1 con descuento.

## Stack (decidido el 2026-09-28)

- Next.js (App Router) + TypeScript.
- Supabase: Postgres + auth + storage en el plan gratuito. Migraciones en `supabase/migrations/`.
- Hosting en Cloudflare Workers vía OpenNext (`@opennextjs/cloudflare`). Se descartó Vercel porque su plan Hobby no permite uso comercial y en diciembre empezamos a cobrar.
- Sin R2 ni Cloudflare Images: R2 pide tarjeta registrada y las imágenes de cartas se sirven desde Scryfall.
- Sincronización diaria de catálogo y precios en GitHub Actions: los bulk de Scryfall y MTGJSON son demasiado grandes para una función serverless.
- Solo se guarda el último precio por carta, fuente y acabado (sin historial), para no pasar de los 500 MB del plan gratuito de Supabase.

## Autenticación (decidido el 2026-09-28)

- Entrar con código de 6 dígitos por correo (OTP de Supabase), sin contraseña. La primera vez crea la cuenta y un trigger crea el `profile`.
- El correo trae código y enlace. El código es el camino principal porque se escribe en la misma pestaña; el enlace (`/auth/confirmar`) falla si se abre en otro navegador o en el navegador interno de una app, pero sirve a quien lee el correo en el mismo dispositivo.
- En desarrollo hay acceso sin correo con la llave secreta (ver `docs/08-validacion.md`). Se descartó un código fijo global para pruebas: si llegara a producción, cualquiera entraría a cualquier cuenta.
- En producción hace falta SMTP propio (Resend, plan gratuito): el SMTP incluido en Supabase es solo para pruebas y manda muy pocos correos por hora. Las plantillas en español están en `supabase/templates/` y hay que copiarlas al proyecto en la nube.
- `proxy.ts` refresca la sesión y hace la redirección optimista; cada página vuelve a verificar con `requireProfile` y RLS protege los datos. OpenNext marca el proxy de Node en Cloudflare como experimental; se probó el login completo en `workerd` con `npm run preview` y funcionó.
- Pendiente: entrar con Google, si los jugadores lo piden.

## Identidad visual (decidido el 2026-09-30)

El diseño de Figma del marketplace (tema oscuro, acento violeta, barra superior y menú lateral) es la identidad de toda la plataforma. Cualquier pantalla con otra apariencia se considera deuda y se actualiza.

- **Tokens:** colores y tipografía (Inter) en `src/app/globals.css` como tema de Tailwind (`bg-paper`, `text-muted`, `border-line`, `bg-accent`…). No usar colores sueltos de Tailwind (`red-600`, `amber-500`) ni los tokens viejos (`foreground`, `background`).
- **Clases compartidas:** `src/app/ui.ts` (botones, campos, tarjetas, insignias, avisos) y `src/app/plataforma.css` (shell, marketplace, listas, modal de ofertas).
- **Componentes:** `src/app/_components/`: `AppShell` (barra y menú), `PageHeader` (etiqueta, título y acciones de cada página), `Icon`, `Brand` y `OffersModal`.
- **Layouts:** `src/app/(app)/` lleva el shell (`/dashboard`, `/listas`, `/listas/nueva`, `/listas/<id>`, `/cuenta`); funciona también sin sesión para las listas públicas. `src/app/(publico)/` es la landing y `/entrar`, con solo la barra superior. Se eliminaron el header viejo (`site-header.tsx`) y el grupo `(sitio)`.
- `/dashboard` es la página de inicio con sesión (`HOME_PATH` en `src/lib/account/validation.ts`); la landing manda ahí si ya hay sesión.
- Comunidad y Mensajes se quedan en el menú como "Pronto", sin contenido. Están fuera del MVP (ver [03](03-mvp.md#marketplace-dashboard)).

## Privacidad del WhatsApp (decidido el 2026-10-01)

Opción **B, solo con oferta aceptada** ([#1](https://github.com/MauLom/enderezoyrobo/issues/1)). El WhatsApp de jugadores y vendedores no se muestra públicamente en listas ni en el marketplace. El contacto entre particulares llega con las ofertas y tratos (fase 3); mientras, con las tiendas se habla por su WhatsApp público, con el pedido armado desde la plataforma.

Se descartaron la A (público por elección: quien lo active queda expuesto a cualquiera) y la C (solo tiendas: el plan Vendedor básico no tendría sentido). B da más privacidad, evita spam y deja el piloto centrado en el inventario de las tiendas.

Implementación ([#2](https://github.com/MauLom/enderezoyrobo/issues/2)):

- El número vive en la tabla `contact` (`profile_id`, `whatsapp`), sin lectura pública: RLS solo deja leerlo y editarlo a su dueño. Se quitó `profile.whatsapp`.
- `whatsapp_de_oferta(offer_id)` (*security definer*, solo con sesión) devuelve el número de la otra parte si la oferta está aceptada y el usuario es el vendedor o el dueño de la lista; si no, null.
- `store.whatsapp` sigue público: es el canal de la tienda.
- Pruebas contra la base en `supabase/tests/contacto_privado.test.sql` (`npm run db:test`).

En marketplace y matching ([#5](https://github.com/MauLom/enderezoyrobo/issues/5)), `whatsapp_de_mis_tratos()` trae de una vez los números de todas las personas con las que el usuario tiene una oferta aceptada; con eso, un vendedor particular tiene botón de WhatsApp solo para quien ya cerró una oferta con él. Para los demás dice "Al aceptar oferta" (las tiendas sin número, "Sin WhatsApp"). La regla está en `src/lib/contact/seller-contact.ts`.
