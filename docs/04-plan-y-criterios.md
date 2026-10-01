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

Lo que bloquea el piloto de noviembre es el flujo de la tienda: sin él no hay inventario real que buscar. El detalle por punto del MVP está en [03](03-mvp.md#estado-2026-09-30) y el trabajo pendiente, en los issues (abajo).

## Plan de trabajo

El trabajo vive en los [issues de GitHub](https://github.com/MauLom/enderezoyrobo/issues), agrupados en un milestone por fase (la vista de [milestones](https://github.com/MauLom/enderezoyrobo/milestones) es el roadmap). Cada issue trae contexto, alcance, criterios de aceptación y de qué otros depende, para que varias personas avancen en paralelo. Las etiquetas indican el área (`cuenta`, `tienda`, `inventario`, `listas`, `ofertas`, `precios`, `infra`, `ui`), si requiere una `decisión` y si `bloquea-piloto`.

Para tomar un issue: asignártelo, trabajar en una rama y abrir un PR que diga `Cierra #N`. Antes de cerrar, lo que pide `CLAUDE.md` (pruebas, lint, typecheck, identidad visual, casos en el seed y en [08](08-validacion.md)).

### Fase 1 · Construir (octubre)

Ruta crítica del piloto, en orden: privacidad del WhatsApp → registro de tienda → verificación → inventario por CSV → despliegue → alta de las 5 tiendas.

| Issue | Qué | Depende de | Para cuándo |
| --- | --- | --- | --- |
| [#1](https://github.com/MauLom/enderezoyrobo/issues/1) | [Decisión] Privacidad del WhatsApp | — | 3 oct |
| [#2](https://github.com/MauLom/enderezoyrobo/issues/2) | Mover el WhatsApp a una tabla con RLS propia | #1 | 5 oct |
| [#3](https://github.com/MauLom/enderezoyrobo/issues/3) | Datos de contacto y zona en `/cuenta` | #2 | 7 oct |
| [#4](https://github.com/MauLom/enderezoyrobo/issues/4) | Tipo de cuenta: jugador o vendedor | — | 7 oct |
| [#5](https://github.com/MauLom/enderezoyrobo/issues/5) | Contactar a vendedores particulares | #2 | 9 oct |
| [#6](https://github.com/MauLom/enderezoyrobo/issues/6) | Registro de tienda desde `/cuenta` | — | 11 oct |
| [#7](https://github.com/MauLom/enderezoyrobo/issues/7) | Página pública de la tienda | #6 | 14 oct |
| [#8](https://github.com/MauLom/enderezoyrobo/issues/8) | Verificación manual de tiendas | #6 | 12 oct |
| [#9](https://github.com/MauLom/enderezoyrobo/issues/9) | Guardar el inventario desde CSV | #6 | 16 oct |
| [#10](https://github.com/MauLom/enderezoyrobo/issues/10) | Pantalla "Mi inventario" | #9 | 18 oct |
| [#12](https://github.com/MauLom/enderezoyrobo/issues/12) | [Decisión] Nombre y dominio | — | 15 oct |
| [#13](https://github.com/MauLom/enderezoyrobo/issues/13) | Desplegar a Cloudflare con Supabase en la nube | #12 (deseable) | 22 oct |
| [#14](https://github.com/MauLom/enderezoyrobo/issues/14) | Correo de producción con Resend | #13 | 22 oct |
| [#15](https://github.com/MauLom/enderezoyrobo/issues/15) | Sincronización diaria contra producción | #13 | 24 oct |
| [#16](https://github.com/MauLom/enderezoyrobo/issues/16) | Dar de alta a las 5 tiendas del piloto | #8, #10, #13, #14 | 31 oct (revisión) |

Se pueden trabajar en paralelo desde el día uno: #1 (decisión), #4, #6 y luego #7, #9 y #10 (la vista previa no necesita el guardado), y #12–#13 (infraestructura).

### Fase 2 · Piloto con tiendas (noviembre)

#11 ver y ajustar el inventario, #17 want list desde CSV de ManaBox/Moxfield, #18 precios de Cardmarket, #19 precios de Card Kingdom, #20 "Mis listas" con las reglas del matching, #21 recordatorio semanal a tiendas y #22 métricas de go/no-go. Más lo que salga del uso real de las tiendas.

### Fase 3 · Abrir y cobrar (diciembre)

#23 hacer oferta por el lote, #24 bandeja de ofertas y calificaciones, #25 [Decisión] oferta de lanzamiento y #26 planes de pago.

Fuera del plan (ver [03](03-mvp.md#fuera-fases-posteriores)): comunidad, mensajería propia, recomendaciones, ubicación por distancia, subastas y pagos de tratos. Comunidad y Mensajes se quedan en el menú como "Pronto".

## Criterios de go/no-go (4 de enero de 2027)

| Criterio | Meta | Si no se cumple |
| --- | --- | --- |
| Tiendas con inventario actualizado en los últimos 30 días | 3 o más | Cerrar: no hay oferta que buscar |
| Want lists creadas por jugadores | 50 o más | Cerrar: no hay demanda que mostrar a las tiendas |
| Ingreso comprometido | $500 MXN/mes o más | Cerrar: los servidores saldrían del bolsillo |
| Búsquedas o matchings por semana | 30 o más | Señal de alerta, no de cierre por sí sola |
