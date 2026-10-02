/**
 * Owners y moderadores de la plataforma (tabla staff): ven y revisan las
 * tiendas en /tiendas. Los correos no van en el repositorio; se dan de alta
 * con este script en cada base.
 *
 *   npm run staff                                # lista el staff
 *   npm run staff -- agregar <correo> owner      # o moderator (por omisión)
 *   npm run staff -- quitar <correo>
 *
 * Usa DATABASE_URL: la local con .env.local, la de la nube con
 * .env.development.local. La persona debe haber entrado a Mazo al menos una vez.
 */
import postgres from "postgres";

const ROLES = ["owner", "moderator"] as const;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta DATABASE_URL");

const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });

async function profileId(email: string): Promise<string> {
  const [user] = await sql<{ id: string }[]>`
    select u.id from auth.users u join profile p on p.id = u.id where lower(u.email) = lower(${email})`;
  if (!user) throw new Error(`${email} no ha entrado nunca a Mazo en esta base: que entre primero y vuelve a correr el script`);
  return user.id;
}

async function main() {
  const [command, email, role = "moderator"] = process.argv.slice(2);
  console.log(`Base: ${new URL(databaseUrl!).hostname}`);

  if (command === "agregar" && email) {
    if (!(ROLES as readonly string[]).includes(role)) throw new Error(`El rol debe ser ${ROLES.join(" o ")}`);
    const id = await profileId(email);
    await sql`insert into staff (profile_id, role) values (${id}, ${role}) on conflict (profile_id) do update set role = excluded.role`;
    console.log(`${email} es ${role}`);
  } else if (command === "quitar" && email) {
    const id = await profileId(email);
    const removed = await sql`delete from staff where profile_id = ${id}`;
    console.log(removed.count ? `${email} ya no es staff` : `${email} no era staff`);
  } else if (command !== undefined) {
    throw new Error("Uso: npm run staff [-- agregar <correo> [owner|moderator] | -- quitar <correo>]");
  }

  const staff = await sql<{ email: string; role: string }[]>`
    select u.email, s.role from staff s join auth.users u on u.id = s.profile_id order by s.role, u.email`;
  console.log(staff.length ? staff.map((s) => `  ${s.role.padEnd(9)} ${s.email}`).join("\n") : "  (sin staff)");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
