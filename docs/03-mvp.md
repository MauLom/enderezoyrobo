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

## Estado (2026-09-29)

| # | Punto | Estado | Qué falta |
| --- | --- | --- | --- |
| 1 | Registro y verificación de tiendas | Parcial | Login y perfil de jugador listos. No hay pantalla para registrar una tienda ni para verificarla: hoy solo existen las del seed. |
| 2 | Importar want list | Parcial | Pegar texto (Moxfield/Arena) funciona con vista previa y avisos. Falta subir CSV de ManaBox/Moxfield (ver 07). |
| 3 | Inventario de tienda por CSV | Parcial | Parser y plantilla (`public/plantilla-inventario.csv`) listos y probados. Falta la pantalla para subirlo y guardarlo. |
| 4 | Matching | Listo | Cobertura por vendedor y mejor combinación, con pedido armado por WhatsApp. |
| 5 | Precios de referencia en MXN | Parcial | Se muestra solo TCGplayer (USD, no foil) convertido a MXN. Faltan Cardmarket (ya está en la base, no se muestra) y Card Kingdom (no se sincroniza). |
| 6 | Listas públicas y ofertas | Parcial | Hacer pública una lista y copiar su enlace funciona. Falta el botón y el flujo de "hacer oferta" (la tabla `offer` existe; el seed trae ofertas). |
| 7 | "Inventario actualizado hace X días" | Listo | Se marca en ámbar después de 30 días. |

## Fuera (fases posteriores)

- Subastas y pujas.
- Pagos, escrow o envíos dentro de la plataforma.
- Feed social, seguidores y mensajería propia.
- Otros TCGs (Pokémon, One Piece, Lorcana).
- Precios de SCG: no tiene API pública; por ahora cada tienda declara su referencia en su perfil ("vendo a SCG −10 %").
