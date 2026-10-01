# Riesgos

El riesgo principal es que el inventario de las tiendas se desactualice y los jugadores dejen de confiar en el matching.

| Riesgo | Mitigación |
| --- | --- |
| Las tiendas no actualizan su inventario | Mostrar "actualizado hace X días"; recordatorio semanal; plantilla CSV que se exporte directo de su sistema actual |
| Solo 5 tiendas no alcanzan para que el matching sea útil | Abrir el plan básico a jugadores que venden su colección; pedir a cada tienda que recomiende a otra |
| Los jugadores siguen usando Facebook y WhatsApp | Enlace compartible por lista para pegar en esos grupos; complementar, no reemplazar |
| Fraude entre particulares | Verificación de identidad, calificaciones después de cada trato, recomendar entrega en tienda |
| Cambios o límites en Scryfall o MTGJSON | Cache local del catálogo y precios; respetar sus límites de uso |
| Los planes gratuitos cambian de condiciones | Stack sin dependencias propietarias (Postgres estándar) para migrar rápido |
| Estado, edición, idioma y foil complican el matching | IDs de Scryfall por impresión; reglas de equivalencia explícitas (ver 07) |
| Exponer el WhatsApp de jugadores | Hoy `profile.whatsapp` es de lectura pública; decidirlo antes de pedir el número (ver 06) y moverlo a una tabla con RLS propia |
| Diseños o prototipos que meten alcance fuera del MVP (feed, chat, distancia) | Revisar cada sección contra 03 antes de integrarla; lo que quede fuera se marca "Pronto" o se quita. Una sola identidad visual (ver 06) |
| El fundador se queda sin tiempo antes del piloto | Plan de octubre por bloques con fecha (ver 04); el flujo de la tienda va antes que cualquier mejora del comprador |
