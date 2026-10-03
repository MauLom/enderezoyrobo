# Validación y datos de prueba

## Datos de prueba (`npm run seed`)

Requiere el catálogo cargado (`npm run sync:catalogo`). Cada corrida borra los datos de prueba anteriores y los vuelve a crear; `npm run seed -- --limpiar` solo los borra. Todo se hace en una transacción: si algo falla, no queda nada a medias.

Los usuarios de prueba tienen correo `@mazo.test` y "(prueba)" en el nombre. Borrar un usuario borra en cascada su perfil, tienda, inventario, listas, ofertas y calificaciones. Ojo: el seed también borra cualquier cuenta `@mazo.test` que hayas creado a mano.

En Supabase local puedes entrar como cualquiera de ellos desde `/entrar`: el código llega a Mailpit (http://127.0.0.1:54324).

| Correo | Tipo | Para qué sirve |
| --- | --- | --- |
| `tienda.dragon@mazo.test` | Tienda verificada, inventario de hace 2 días | La que más cubre; hizo una oferta pendiente a Beto |
| `tienda.guarida@mazo.test` | Tienda verificada, inventario de hace 10 días | Foil, cartas en español, precios más bajos en MP; oferta aceptada con Carla y calificación de 5 |
| `tienda.barrio@mazo.test` | Tienda **sin verificar**, inventario de hace 45 días | Insignia de verificación y aviso de inventario viejo; sus cartas HP y DMG no cumplen la condición mínima |
| `tienda.nueva@mazo.test` | Tienda **pendiente**, registrada hoy, sin inventario | Primera en "Por revisar" de `/tiendas`; en `/cuenta` ve "Pendiente de verificación" |
| `tienda.rechazada@mazo.test` | Tienda **rechazada** (dirección incompleta) | Ve el motivo en `/cuenta`; al corregir sus datos vuelve a "Por revisar" |
| `moderador@mazo.test` | Jugador y **moderador** (tabla `staff`) | Ve "Tiendas" en el menú y revisa las tiendas en `/tiendas` |
| `vendedora.ana@mazo.test` | Vendedor sin tienda, con WhatsApp privado y zona San Nicolás | Inventario de un particular; oferta aceptada con Beto por su Cyclonic Rift |
| `jugador.beto@mazo.test` | Jugador con WhatsApp privado y zona Monterrey | Lista pública "Commander de Atraxa" y lista privada "Modern (privada)" |
| `jugadora.carla@mazo.test` | Jugadora sin WhatsApp | Lista pública "Pauper Izzet" |

Casos que cubre el matching con estos datos (comprobados con `src/lib/matching`):

- **Commander de Atraxa (Beto):** ninguna tienda sola la completa (El Dragón 75 %, La Guarida 13 %); juntas llegan al 88 %. Falta Demonic Tutor: solo hay una copia DMG y la lista pide LP o mejor. Pide una Atraxa de impresión exacta (2XM 190), Rhystic Study en NM y Smothering Tithe en foil.
- **Pauper Izzet (Carla):** pide 4 copias de cada carta; ninguna tienda tiene todo (La Guarida 75 %, El Dragón 50 %) y entre las dos la cubren al 100 %. El Counterspell HP de Cartas del Barrio no cuenta porque la lista pide MP o mejor.
- **Modern (Beto, privada):** Thoughtseize en español (solo La Guarida lo tiene en español). Un visitante sin sesión no debe ver esta lista.
- **Permisos:** sin sesión se ven las dos listas públicas y ninguna oferta; Beto ve sus tres listas y las dos ofertas que recibió. Nadie sin sesión lee la tabla `contact`; Ana y Beto obtienen el WhatsApp del otro con `whatsapp_de_oferta` (oferta aceptada) y Carla no obtiene el de Ana. Lo comprueba `npm run db:test`.

## Qué validar en la app

- **Crear lista** (`/listas/nueva`): pega una lista y pulsa "Revisar lista". Prueba un encabezado (`Deck`), una carta de dos caras solo con la cara frontal (`Delver of Secrets`), un set que no existe (`1 Sol Ring (2X2) 190` avisa y acepta cualquier impresión), una errata (`Ponderr` no se guarda) y líneas repetidas (se suman). Luego "Guardar lista".
- **Ofertar por el lote** (`/listas/<id>` de "Pauper Izzet"): Tienda El Dragón ve "Tu inventario cubre 2 de 4 cartas" y, al pulsar "Hacer oferta por el lote", Lightning Bolt y Counterspell con cantidades y total a sus precios; cambiar una cantidad recalcula el total mientras no lo edites a mano. Al enviar, la tarjeta cambia a "Enviaste una oferta de $… · Pendiente" y no deja mandar otra. Ana (sin cartas de la lista) puede ofertar ajustando cantidades a mano; La Guarida ve que su última oferta fue aceptada y puede mandar otra; Beto (jugador) ve la invitación a cambiar a vendedor en Mi cuenta; Carla, dueña de la lista, no ve la sección. Lo que impide la base (ofertar sobre la propia lista o una privada, dos pendientes) lo comprueba `npm run db:test`. Para repetir el caso, `npm run seed` borra las ofertas nuevas.
- **Bandeja de ofertas** (`/ofertas`, "Ofertas" en el menú): Beto tiene un 1 en el menú; en "Recibidas" ve la oferta pendiente de Tienda El Dragón ($380, Sol Ring y Atraxa) con "Aceptar" y "Rechazar", y la aceptada de Ana con "Escribir a Ana por WhatsApp" y estrellas para calificarla. Al aceptar la de El Dragón, el 1 desaparece y sale el botón de WhatsApp de la tienda. El Dragón ve su oferta en "Enviadas" con "Retirar oferta". Carla ve la aceptada de La Guarida ya calificada (★★★★★) y el aviso de agregar su WhatsApp en Mi cuenta; La Guarida ve que Carla no tiene WhatsApp registrado. Las reglas (quién acepta, rechaza o retira, calificar una vez y solo aceptadas) las comprueba `npm run db:test`. `npm run seed` regresa las ofertas a su estado inicial.
- **Want list desde CSV** (`/listas/nueva`): "Subir CSV de ManaBox o Moxfield" con `src/lib/import/fixtures/manabox-ejemplo.csv` (o el de Moxfield) llena la caja y el nombre de la lista; "Revisar lista" muestra 2× Ragavan (MH2 138), Lightning Bolt foil y Sword of Fire and Ice, con avisos de que M19 204 y M21 287 no existen y se acepta cualquier impresión.
- **Detalle de lista** (`/listas/<id>`): "Dónde conseguirlas" muestra cada vendedor con cobertura, total, cartas y el botón "Pedir por WhatsApp" con el mensaje armado; con más de una tienda, la mejor combinación. En "Commander de Atraxa", Beto ve a Ana con "Pedir por WhatsApp"; sin sesión o con otra cuenta, Ana aparece sin botón y con la nota de que su WhatsApp se comparte al aceptar una oferta. En "Cartas", el menú ⋯ cambia cantidad, condición mínima y foil, y el matching se recalcula. Cada carta muestra su referencia de TCGplayer y, debajo, la de CK (por ejemplo Sol Ring, Arcane Signet o Command Tower); si falta CK es que no se ha corrido `npm run sync:catalogo` con esta versión.
- **Compartir**: "Hacer pública" y copiar el enlace; abierto en una ventana privada, se ve sin sesión. Una lista privada da 404 a otros.
- **Regreso tras entrar**: sin sesión, `/listas/nueva` manda a `/entrar` y al entrar vuelve a `/listas/nueva`. Entrando directo desde `/entrar` (o con el enlace del correo) se llega a `/dashboard`.
- **Marketplace** (`/dashboard`): pide sesión. Muestra tu nombre e iniciales, las cartas del inventario agrupadas con su precio más bajo y, primero, las que están en tus listas (con corazón). Como Beto, "Mi wishlist" muestra las cartas de sus listas de Atraxa y Modern que alguien tiene; el panel derecho dice cuántas tienen ofertas. Al abrir una carta salen todas las ofertas; las de las tiendas tienen botón de WhatsApp; la de Ana tiene botón para Beto (oferta aceptada entre ellos) y dice "Al aceptar oferta" para Carla o cualquier otro. Con un usuario sin listas, el panel invita a armar una.
- **Mis listas** (`/listas`): "Mis listas" del menú lateral (y "Ver todo" o "Administrar mis listas" del panel derecho) abre la página con el mismo shell; elegir una lista cambia la URL a `?lista=<id>`. Como Beto: sus listas a la izquierda; al elegir "Commander de Atraxa", cada carta con las ofertas que cumplen lo que pide la lista (condición mínima, foil, idioma e impresión, igual que "Comparar tiendas") y su mejor precio; Demonic Tutor sale "sin ofertas" porque la única copia es DMG y la lista pide LP. Al abrir una carta, el modal muestra solo esas ofertas. El panel "Tu wishlist" del marketplace cuenta igual.
- **Cuenta**: con sesión, el menú lateral tiene la sección "Cuenta" con "Mi perfil" (`/cuenta`, cambiar el nombre visible; el cambio se ve de inmediato en la barra y el menú) y "Salir" (cierra la sesión y vuelve a la landing). En celular, "Salir" está dentro de `/cuenta` (avatar de la barra superior).
- **Contacto** (`/cuenta`): Beto ve su número (+528100000011) y "Monterrey" ya cargados. Un número inválido (`12345`) muestra el error en la misma tarjeta; uno de 10 dígitos (`81 1234 5678`) se guarda como `+528112345678`; dejarlo vacío y guardar lo borra. Al elegir otra zona, el subtítulo de la tarjeta dice "Entregas en …". Carla empieza sin número ni zona.
- **Tipo de cuenta** (`/cuenta`): Beto o Carla (jugadores) ven "Quiero vender mi colección" y pasan a vendedor; Ana (vendedora) ve "Volver a jugador". Las tiendas del seed ven su tipo sin botón para cambiarlo. El tipo también aparece bajo el nombre, abajo a la izquierda del menú, y cambia al momento. Que nadie pueda ponerse `store` por su cuenta lo prueba `npm run db:test`.
- **Registrar tienda** (`/cuenta`, #6): Beto o Carla (o un usuario nuevo) ven "¿Tienes una tienda?" y "Registrar mi tienda", que abre el formulario: nombre, dirección y WhatsApp de la tienda obligatorios, referencia de precio opcional ("SCG −10 %"). Al registrarla, la tarjeta cambia a "Mi tienda" con "Pendiente de verificación", el tipo de cuenta pasa a "Tienda" y ya no se puede cambiar. Los datos se editan ahí mismo. Cartas Express ve "Rechazada" con el motivo; al corregir la dirección y guardar, vuelve a "Pendiente de verificación". Que una tienda no pueda verificarse sola (ni con `update`, ni con la función del staff, ni dándose de alta como staff) lo prueba `npm run db:test`. `npm run seed` regresa a Beto y Carla a jugadores.
- **Revisión de tiendas** (`/tiendas`, solo staff): el moderador ve "Administración → Tiendas" en el menú con el número de tiendas por revisar (2: Dados y Mazos y Cartas del Barrio). La página agrupa las tiendas en "Por revisar", "Rechazadas" y "Verificadas", con dirección, WhatsApp (abre un chat), referencia de precio, responsable con su correo y cuántas cartas tiene. "Verificar" da la insignia (se ve en el marketplace, en las listas y en la tarjeta "Comunidad MTY"); "Rechazar" pide un motivo que la tienda ve en `/cuenta`; "Quitar verificación" la regresa a pendiente. Lo mismo desde la terminal (procedimiento en [09](09-verificacion-de-tiendas.md)): `npm run tienda:verificar` lista Cartas del Barrio, Dados y Mazos y Cartas Express con su motivo; `npm run tienda:verificar -- tienda.dragon@mazo.test --quitar` cambia su insignia a "Tienda sin verificar" en su página y en "Dónde conseguirlas" de "Commander de Atraxa", y sin `--quitar` la regresa. `npm run seed` deja todo como estaba. Que la función que usa el script no se pueda llamar con sesión lo prueba `npm run db:test`. Beto o cualquier cuenta que no sea staff no ve el menú y `/tiendas` responde 404.
- **Página de tienda** (`/tiendas/<id>`, #7, sin sesión): en el modal de ofertas o en "Dónde conseguirlas" de "Commander de Atraxa", el nombre de una tienda lleva a su página (el de Ana no, porque no es tienda). Tienda El Dragón tiene "✓ Tienda verificada", "Inventario actualizado hace 2 días", dirección, "TCGplayer −10 %", el botón "Escribir por WhatsApp" y sus 9 cartas; al abrir una sale el modal con su oferta. Cartas del Barrio dice "Tienda sin verificar", el aviso en ámbar "Inventario actualizado hace 45 días" y la nota de que todavía no está verificada. Dados y Mazos (sin inventario) dice "Sin inventario cargado" y "Esta tienda todavía no ha cargado inventario". Un id que no existe da 404. `/tiendas` (sin id) sigue siendo solo para el staff y pide sesión.
- **Mi inventario** (`/inventario`, #9 y #10): El Dragón ve "Mi inventario" en el menú, "32 cartas (9 distintas)" e "Inventario actualizado hace 2 días". Al subir `src/lib/import/fixtures/inventario-ejemplo.csv` y "Revisar inventario": 52 cartas (10 distintas), 7 avisos de cartas sin set (cuál impresión se usó) y cada carta con set, condición, idioma, foil y precio. "Reemplazar mi inventario" deja 10 distintas y "actualizado hoy"; subirlo otra vez da lo mismo. La Demonic Tutor LP del archivo aparece en el marketplace (busca "Demonic") y en "Commander de Atraxa" de Beto deja de salir "sin ofertas". Con `inventario-con-errores.csv` salen 4 errores (carta que no existe, condición y cantidad inválidas, Sol Ring repetida con otro precio) y no aparece el botón para guardar. Ana (vendedora) ve el error del plan si pega `carta,cantidad,precio` y `Sol Ring,101,45`. Beto (jugador) no ve el menú y `/inventario` lo invita a cambiar a vendedor. En celular la página no se sale de la pantalla. Que el reemplazo sea completo, que un error no deje nada a medias, el límite de 100 y que un jugador no pueda cargar lo prueba `npm run db:test`. `npm run seed` regresa los inventarios.
- **Identidad visual**: todas las pantallas (landing, `/entrar`, `/dashboard`, `/listas`, `/listas/nueva`, `/listas/<id>`, `/cuenta`, `/tiendas`, `/tiendas/<id>`, `/inventario` y el 404) usan el tema oscuro con acento violeta; las que tienen sesión comparten barra superior y menú lateral. Una lista pública abierta sin sesión se ve con el shell y el botón "Entrar". La búsqueda de la barra filtra el marketplace al escribir y, desde otra página, lleva a `/dashboard?q=…` al dar Enter. En celular el menú pasa abajo.
- Con el seed, la lista pública de Beto ("Commander de Atraxa") y la de Carla ("Pauper Izzet") reproducen los casos de la tabla de arriba.

## Validar contra Supabase en la nube

1. Crea el archivo `.env.development.local` en la raíz del repo con las variables del proyecto. Está en `.gitignore`. En `npm run dev` y en los scripts reemplaza a `.env.local`; bórralo o renómbralo para volver a local.

   ```bash
   # Project Settings → API (o el botón "Connect")
   NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # Connect → "Session pooler" (la conexión directa es solo IPv6)
   DATABASE_URL=postgresql://postgres.<proyecto>:<contraseña>@aws-0-<región>.pooler.supabase.com:5432/postgres
   ```

   Si la contraseña tiene caracteres como `@`, `#` o `/`, van codificados en la URL (`@` → `%40`).

2. Aplica las migraciones al proyecto:

   ```bash
   npm run db:push -- --dry-run   # muestra qué migraciones aplicaría
   npm run db:push                # pide confirmación y las aplica
   ```

   Toma `DATABASE_URL` de `.env.development.local` y se niega a correr contra la base local.

3. Configura el correo de acceso en el dashboard:
   - **Authentication → Emails → Templates:** en "Confirm signup" y "Magic Link", pon el asunto "Tu código para entrar a Mazo" y como cuerpo el contenido de `supabase/templates/codigo.html`. Trae el código de 6 dígitos y un enlace que entra directo. Sin este cambio, el correo solo trae el enlace original de Supabase, que la app no sabe recibir.
   - **Authentication → URL Configuration → Site URL:** `http://localhost:3000` mientras pruebas en local; la URL pública cuando haya despliegue. El enlace del correo apunta ahí.
   - **Authentication → Providers → Email:** expiración del código en 600 segundos.

4. Carga el catálogo: `npm run sync:catalogo` (~120 MB de datos con Card Kingdom; tarda más que en local por la red).

5. Da de alta a los owners y moderadores con `npm run staff -- agregar <correo> owner` (o `moderator`). La persona debe haber entrado a Mazo al menos una vez en esa base. Los correos no se guardan en el repositorio. `npm run staff` lista el staff y `npm run staff -- quitar <correo>` lo quita.

6. Opcional: `npm run seed -- --remoto`. Los datos de prueba se ven públicamente en la app; bórralos con `npm run seed -- --limpiar --remoto` antes de invitar a gente real.

7. `npm run dev` y entra con tu correo, o con el acceso de desarrollo (abajo) sin gastar correos.

Límite del correo incluido en Supabase: solo manda a direcciones de miembros de tu organización y muy pocos correos por hora para todo el proyecto. Al llegar al límite, `/entrar` muestra "Se alcanzó el límite de correos por ahora". Para probar con más personas hace falta SMTP propio (Resend).

## Entrar sin correo (solo desarrollo)

En `npm run dev`, si existe `SUPABASE_SECRET_KEY`, `/entrar` muestra un panel para entrar con cualquier correo, o con un clic como un usuario del seed, sin mandar correo ni gastar el límite. Si la cuenta no existe, se crea.

- Agrega la llave a `.env.development.local` para la nube (Project Settings → API Keys → secret) o a `.env.local` para local (`npx supabase status` la muestra como "Secret").
- No existe en producción: la acción revisa `NODE_ENV === "development"`, que en el build siempre es `"production"`, y en Cloudflare no se configura la llave secreta.
- La llave secreta se salta RLS. Nunca debe llevar el prefijo `NEXT_PUBLIC_` ni subirse al repo.
