/**
 * Verificación manual de tiendas desde la línea de comandos (#8). Es lo mismo
 * que hace el staff en /tiendas; el procedimiento está en docs/09.
 *
 *   npm run tienda:verificar                     # lista las tiendas por revisar
 *   npm run tienda:verificar -- <correo>         # verifica la tienda de esa cuenta
 *   npm run tienda:verificar -- <correo> --quitar
 *
 * Usa DATABASE_URL: la local con .env.local, la de la nube con
 * .env.development.local. Se conecta directo (sin sesión) y llama a
 * fijar_verificacion, que solo puede ejecutar esa conexión.
 */
import postgres from "postgres";
import { storeStatus, STORE_STATUS_LABEL } from "@/lib/account/store";
import { daysAgoLabel } from "@/lib/pricing/mxn";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta DATABASE_URL");

const sql = postgres(databaseUrl, { max: 1, onnotice: () => {}, transform: postgres.camel });

type StoreRow = {
  id: string;
  email: string;
  name: string;
  address: string | null;
  whatsapp: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  reason: string | null;
  createdAt: string;
};

const STORE_COLUMNS = sql`
  select s.id, u.email, s.name, s.address, s.whatsapp, s.verified_at, r.rejected_at, r.reason, s.created_at
  from store s
  join auth.users u on u.id = s.profile_id
  left join store_rejection r on r.store_id = s.id`;

function describe(store: StoreRow): string {
  const status = STORE_STATUS_LABEL[storeStatus(store)];
  return [
    `${store.name} <${store.email}> · ${status} · registrada ${daysAgoLabel(store.createdAt)}`,
    `    ${store.address ?? "sin dirección"} · ${store.whatsapp ?? "sin WhatsApp"}`,
    ...(store.reason ? [`    Motivo del rechazo: ${store.reason}`] : []),
  ].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const remove = args.includes("--quitar");
  console.log(`Base: ${new URL(databaseUrl!).hostname}`);

  if (!email) {
    const pending = await sql<StoreRow[]>`${STORE_COLUMNS} where s.verified_at is null order by r.rejected_at nulls first, s.created_at`;
    if (pending.length === 0) console.log("No hay tiendas por revisar.");
    for (const store of pending) console.log(describe(store));
    return;
  }

  const [store] = await sql<StoreRow[]>`${STORE_COLUMNS} where lower(u.email) = lower(${email})`;
  if (!store) throw new Error(`${email} no tiene una tienda registrada en esta base`);
  await sql`select fijar_verificacion(${store.id}, ${!remove})`;
  const [updated] = await sql<StoreRow[]>`${STORE_COLUMNS} where s.id = ${store.id}`;
  console.log(describe(updated));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
