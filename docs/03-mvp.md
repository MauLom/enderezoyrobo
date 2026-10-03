# MVP

El MVP responde una sola pregunta: ¿qué tiendas de Monterrey tienen las cartas de mi lista y a qué precio?

## Dentro

1. Registro de usuarios y tiendas, con verificación manual de tiendas.
2. Importar una want list pegando texto en formato Moxfield o ManaBox, o subiendo un CSV.
3. Importar el inventario de una tienda por CSV con una plantilla simple: carta, set, número de colección, condición, idioma, foil, cantidad, precio.
4. Matching: porcentaje de la lista que cubre cada tienda, y la combinación de 2 o 3 tiendas que cubre más al menor costo.
5. Precios de referencia por carta (CK, TCGplayer, Cardmarket) convertidos a MXN, junto al precio de la tienda.
6. Listas públicas con botón de "hacer oferta por el lote"; el trato se cierra por WhatsApp o en tienda.
7. Cada tienda muestra "inventario actualizado hace X días".

## Estado (2026-09-30)

| # | Punto | Estado | Qué falta |
| --- | --- | --- | --- |
| 1 | Registro y verificación de tiendas | Listo | Login con código, nombre visible y salir listos (`/cuenta`, "Mi perfil" y "Salir" en el menú). Tipo de cuenta listo: jugador o vendedor desde `/cuenta`; `store` solo al registrar una tienda (RLS, prueba en `supabase/tests/`). En "Contacto" se guarda, edita y borra el WhatsApp (privado, tabla `contact`, decisión B en 06) y se elige la zona de entrega (municipio, pública). Registro de tienda listo (#6): formulario en `/cuenta` con nombre, dirección, WhatsApp y referencia de precio; el perfil pasa a tienda y queda "Pendiente de verificación" hasta que el staff la revise. Owners y moderadores (tabla `staff`, `npm run staff`) verifican, rechazan con motivo o quitan la verificación en `/tiendas` ("Administración → Tiendas" en el menú, solo para ellos). Verificación manual (#8): procedimiento en `docs/09` y también desde la línea de comandos con `npm run tienda:verificar`, contra la base local o la de la nube. Issues #1–#8. |
| 2 | Importar want list | Listo | Pegar texto (Moxfield/Arena) o subir el CSV de ManaBox/Moxfield, con la misma vista previa y avisos (ver 07). |
| 3 | Inventario de tienda por CSV | Parcial | Parser y plantilla (`public/plantilla-inventario.csv`) listos y probados. Falta la pantalla para subirlo y guardarlo. Issues #9 y #10. |
| 4 | Matching | Listo | Cobertura por vendedor y mejor combinación, con pedido armado por WhatsApp. |
| 5 | Precios de referencia en MXN | Parcial | En el detalle de lista se muestran TCGplayer y Card Kingdom (USD, no foil) convertidos a MXN; CK se sincroniza a diario desde MTGJSON (#19). Falta Cardmarket (ya está en la base, no se muestra; #18). |
| 6 | Listas públicas y ofertas | Listo | Hacer pública una lista y copiar su enlace funciona. Reglas de la oferta en `src/lib/offers/` (armar, validar, cambios de estado) y tabla `offer` con su trigger listos; el seed trae ofertas. En `/listas/<id>` de una lista pública ajena, un vendedor o tienda hace una oferta por el lote: propuesta armada desde su inventario, cantidades y total ajustables y mensaje (#23); un jugador ve la invitación a cambiar a vendedor. "Ofertas" en el menú (`/ofertas`, con el número de recibidas por responder): recibidas y enviadas; el dueño acepta o rechaza, el vendedor retira, solo mientras está pendiente; al aceptar, cada uno ve el WhatsApp del otro y puede calificarlo (#24). |
| 7 | "Inventario actualizado hace X días" | Listo | Se marca en ámbar después de 30 días (`isInventoryStale`), en "Dónde conseguirlas" y en la página pública de cada tienda (`/tiendas/<id>`, #7): nombre, insignia, dirección, referencia de precio, WhatsApp y sus cartas con el grid del marketplace. Se ve sin sesión y se llega desde el modal de ofertas y desde "Dónde conseguirlas". |

## Marketplace (`/dashboard`)

El 2026-09-30 llegó `src/app/dashboard/` (hoy `src/app/(app)/dashboard/`): un prototipo en Figma/Vite de la interfaz completa (marketplace, wishlist, comunidad y mensajes) con datos ficticios. Ese mismo día se conectó a los datos reales y se recortó a lo que entra en el MVP. Pide sesión y es la página a la que se llega al entrar.

| Sección del prototipo | Estado |
| --- | --- |
| Marketplace | Real. Inventario de tiendas y vendedores agrupado por carta, con el precio más bajo, imagen del catálogo y vendedor. Primero las cartas que el usuario busca; luego las ofertas más recientes (hasta 200 renglones, más todas las de sus listas). Lógica en `src/lib/marketplace/`, consulta en `src/supabase/marketplace.ts` |
| Modal "Ofertas disponibles" | Real. Cada oferta con condición, set, foil, idioma y existencias; el botón abre WhatsApp con el mensaje armado. Las tiendas tienen WhatsApp público; un vendedor particular tiene botón solo para quien tiene una oferta aceptada con él, y si no, dice "Al aceptar oferta" (ver 06, privacidad del WhatsApp) |
| Búsqueda | En la barra superior de todas las páginas. Filtra el marketplace (`/dashboard?q=…`) sin acentos ni mayúsculas. No consulta a Scryfall |
| Filtro "Mi wishlist" y panel "Tu wishlist" | Real. Cartas de todas las want lists del usuario con cuántas ofertas cumplen lo que pide cada lista (reglas del matching) y el mejor precio; "Administrar" lleva a `/listas` |
| Usuario (nombre, iniciales, correo) | Real, del perfil con sesión |
| Barra superior, menú lateral y tarjeta "Comunidad MTY" | Son el shell de toda la plataforma (ver 06, identidad visual); la tarjeta muestra cuántas tiendas verificadas hay |
| Mis listas | `/listas` (dentro del mismo shell): las want lists del usuario y, de la elegida (`?lista=<id>`), cada carta con cuántas ofertas cumplen condición mínima, foil, idioma e impresión (`matchesWant`, #20) y el mejor precio; una carta con ofertas abre el mismo modal con solo esas ofertas. "Comparar tiendas" abre `/listas/<id>` con el matching completo |
| "Publicar carta" | Se cambió por "Nueva want list". Publicar inventario de un vendedor sin tienda sigue pendiente (punto 3) |
| Filtro "Cerca de mí" y radio en km | Quitado: no guardamos ubicación. Se muestra la dirección de la tienda si la tiene |
| Inicio "Para ti", Comunidad, Mensajes, notificaciones | Quitados (fuera del MVP). Comunidad y Mensajes quedan en el menú como "Pronto"; el diseño original está en el historial de git (commit `b2703ae`) |

## Fuera (fases posteriores)

- Subastas y pujas.
- Pagos, escrow o envíos dentro de la plataforma.
- Feed social, seguidores y mensajería propia (venían en el prototipo de `/dashboard`; se quitaron).
- Ubicación del usuario y búsqueda por distancia.
- Otros TCGs (Pokémon, One Piece, Lorcana).
- Precios de SCG: no tiene API pública; por ahora cada tienda declara su referencia en su perfil ("vendo a SCG −10 %").
