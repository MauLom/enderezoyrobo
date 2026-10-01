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

## Pendiente: privacidad del WhatsApp

`profile.whatsapp` y `store.whatsapp` son públicos, porque la política de lectura de ambas tablas es `using (true)`. Para una tienda está bien. Para un jugador, su número no debería verse hasta que haya una oferta de por medio. Hay que decidirlo antes de pedir el número en la UI. Por eso `/cuenta` todavía no lo pide.

Consecuencia actual: el botón "Pedir por WhatsApp" solo usa `store.whatsapp`, así que un vendedor sin tienda aparece en el matching con "Este vendedor no tiene WhatsApp registrado" y no hay forma de contactarlo. Hay que resolver esto antes de abrir el plan Vendedor básico.
