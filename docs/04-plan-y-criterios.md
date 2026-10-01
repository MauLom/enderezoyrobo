# Plan de 3 meses y criterios de cierre

El proyecto sigue después del **4 de enero de 2027** solo si hay tiendas activas, jugadores usándolo e ingreso que cubra los servidores. Si falla cualquiera de los tres, se cierra.

| Fase | Mes | Objetivos |
| --- | --- | --- |
| 1. Construir | Octubre 2026 | Catálogo desde Scryfall; importar listas e inventario; matching y precios en MXN; cuenta completa; despliegue |
| 2. Piloto con tiendas | Noviembre 2026 | 5 tiendas suben su CSV; 20–30 jugadores prueban; ajustar según el uso real |
| 3. Abrir y cobrar | Diciembre 2026 | Ofertas sobre listas públicas; activar planes de pago; difundir en grupos de Monterrey |

**Revisión a fin de octubre:** si menos de 3 tiendas entregaron su inventario, frenar antes de invertir más tiempo.

## Avance al 2026-09-30

La fase 1 va adelantada en el lado del comprador y atrasada en el de la tienda.

- **Listo:** catálogo y precios diarios, login con código, want lists (pegar texto, editar, hacer pública, compartir), matching con mejor combinación y pedido por WhatsApp, marketplace por carta, y la identidad visual única en todas las pantallas (ver [06](06-decisiones-abiertas.md#identidad-visual-decidido-el-2026-09-30)).
- **A medias:** la cuenta. `/cuenta` permite cambiar el nombre visible y salir, y desde hoy el menú lateral tiene "Mi perfil" y "Salir". Faltan los datos de contacto (WhatsApp), la zona y el tipo de cuenta (jugador, vendedor o tienda).
- **Sin empezar:** todo el flujo de la tienda (registrarse, verificarla, subir inventario), la pantalla de ofertas y el despliegue a producción.

Lo que bloquea el piloto de noviembre es el flujo de la tienda: sin él no hay inventario real que buscar. El detalle por punto del MVP está en [03](03-mvp.md#estado-2026-09-30).

## Plan de trabajo de octubre

En orden. Cada bloque incluye su pantalla (con la identidad de la plataforma), sus casos en el seed y en [08](08-validacion.md), y pruebas de su lógica en `src/lib/`.

| # | Bloque | Qué incluye | Depende de | Para cuándo |
| --- | --- | --- | --- | --- |
| 1 | Decidir la privacidad del WhatsApp | Elegir una de las opciones de [06](06-decisiones-abiertas.md#pendiente-privacidad-del-whatsapp) | — | 3 oct |
| 2 | Cuenta completa | En `/cuenta`: WhatsApp (con la regla de privacidad del bloque 1), zona o municipio de entrega, tipo de cuenta (jugador o vendedor; tienda se pide en el bloque 3). Validación del número con `src/lib/contact/whatsapp.ts`. Si hace falta, migración para mover el WhatsApp del jugador a una tabla privada | 1 | 7 oct |
| 3 | Registro de tienda | Formulario "Registrar mi tienda" en `/cuenta`: nombre, dirección, WhatsApp, referencia de precio ("SCG −10 %"). Crea el renglón en `store` sin verificar. Página pública de la tienda con su insignia | 2 | 11 oct |
| 4 | Verificación manual | Cómo verifica el fundador (consulta SQL documentada o pantalla mínima de administración protegida); qué se revisa antes de verificar | 3 | 12 oct |
| 5 | Inventario por CSV | Pantalla "Mi inventario": descargar plantilla, subir CSV, vista previa con errores por línea (el parser ya existe), reemplazar el inventario y actualizar `inventory_updated_at`. Ver el inventario cargado | 3 | 18 oct |
| 6 | Despliegue | Cloudflare Workers con OpenNext, Supabase en la nube, SMTP con Resend, plantillas de correo y URL del sitio; correr la sincronización diaria contra producción | — | 22 oct |
| 7 | Invitar a las tiendas | Dar de alta a las 5 tiendas conocidas, acompañarlas a subir su primer CSV | 5, 6 | 31 oct (revisión) |
| 8 | CSV de ManaBox/Moxfield para want lists | Conseguir exports reales, escribir el parser y aceptarlo en "Nueva want list" | — | Noviembre, si hay tiempo |
| 9 | Precios de Cardmarket y Card Kingdom | Mostrar Cardmarket (ya está en la base); cruzar IDs de MTGJSON para Card Kingdom | — | Noviembre |
| 10 | Ofertas sobre listas públicas | Botón "Hacer oferta por el lote", bandeja de ofertas recibidas y enviadas, aceptar, rechazar y retirar (la lógica ya existe en `src/lib/offers/`) | 2 | Diciembre (fase 3) |

Fuera de este plan (ver [03](03-mvp.md#fuera-fases-posteriores)): comunidad, mensajería propia, recomendaciones, ubicación por distancia, subastas y pagos. Comunidad y Mensajes se quedan en el menú como "Pronto".

Pendiente sin fecha: el nombre definitivo y el dominio ([06](06-decisiones-abiertas.md#nombre)); hace falta antes del despliegue del bloque 6 si se quiere un dominio propio.

## Criterios de go/no-go (4 de enero de 2027)

| Criterio | Meta | Si no se cumple |
| --- | --- | --- |
| Tiendas con inventario actualizado en los últimos 30 días | 3 o más | Cerrar: no hay oferta que buscar |
| Want lists creadas por jugadores | 50 o más | Cerrar: no hay demanda que mostrar a las tiendas |
| Ingreso comprometido | $500 MXN/mes o más | Cerrar: los servidores saldrían del bolsillo |
| Búsquedas o matchings por semana | 30 o más | Señal de alerta, no de cierre por sí sola |
