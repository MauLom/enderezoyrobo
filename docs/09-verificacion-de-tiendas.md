# Verificación de tiendas

La insignia "Tienda verificada" dice que la tienda existe, que su WhatsApp lo contesta el negocio y que sabemos quién la atiende. Es manual y nunca se vende: no depende del plan ni de ningún pago (ver [02](02-modelo-de-negocio.md)).

Una tienda se registra desde `/cuenta` y queda "Pendiente de verificación". Mientras tanto su inventario se ve en el marketplace y en su página, sin la insignia.

## Qué revisar antes de verificar

1. **Tienda física.** La dirección tiene calle, número y colonia, y corresponde a un local abierto al público que vende Magic. Basta con buscarla en un mapa y en sus redes. Si hay dudas, se pide por WhatsApp una foto de la fachada o del mostrador.
2. **WhatsApp.** Escribirle desde el enlace de `/tiendas`. Debe contestar el negocio, no una persona que no sabe de la tienda, y confirmar el nombre y la dirección registrados.
3. **Responsable.** Preguntar el nombre de quien atiende y confirmar que es el dueño o el encargado. Pedirle que confirme por el mismo WhatsApp el correo con el que registró la cuenta (aparece en `/tiendas`), para saber que la cuenta es de la tienda y no de un tercero.

Si las tres se cumplen, se verifica. Si falta algo, se rechaza con un motivo concreto que diga qué corregir ("La dirección no tiene número", "El WhatsApp no contestó en 3 días"). La tienda lo ve en `/cuenta` y, al corregir sus datos, vuelve sola a "Por revisar".

## Cuándo quitar la verificación

- La tienda cerró o se mudó sin actualizar su dirección.
- El WhatsApp deja de contestar o ya no es del negocio.
- Hay quejas fundadas de jugadores (precios que no respeta, cartas que no tiene, trato malo).

Quitar la verificación la regresa a pendiente. Rechazarla también le quita la insignia y le deja el motivo.

## Herramientas

**Pantalla `/tiendas`** (owners y moderadores, ver `npm run staff` en [08](08-validacion.md)): agrupa las tiendas en por revisar, rechazadas y verificadas. Tiene "Verificar", "Rechazar" con motivo y "Quitar verificación".

**Línea de comandos** (con acceso a la base):

```bash
npm run tienda:verificar                          # tiendas por revisar, con correo y motivo de rechazo
npm run tienda:verificar -- <correo>              # verifica la tienda de esa cuenta
npm run tienda:verificar -- <correo> --quitar     # le quita la verificación
```

Toma `DATABASE_URL` de `.env.local` (base local) o de `.env.development.local` (nube) e imprime a qué base se conectó. Rechazar con motivo solo se hace desde `/tiendas`.

Las dos usan la misma función de la base, `fijar_verificacion`: marca `store.verified_at`, mantiene `profile.verified` igual y, al verificar, borra el rechazo vigente. Desde la app solo la llaman `verificar_tienda` y `quitar_verificacion`, que exigen ser staff; la línea de comandos la llama directo.

## Dónde se ve la insignia

- Página pública de la tienda (`/tiendas/<id>`).
- "Dónde conseguirlas" del detalle de cada lista (matching) y el modal de ofertas.
- El conteo de "Comunidad MTY" en el menú lateral.
