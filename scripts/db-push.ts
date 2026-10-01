/**
 * Aplica las migraciones de supabase/migrations/ a la base de DATABASE_URL
 * (normalmente la de la nube, desde .env.development.local).
 *
 *   npm run db:push -- --dry-run   # muestra qué migraciones aplicaría
 *   npm run db:push
 */
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta DATABASE_URL");

const host = new URL(databaseUrl).hostname;
if (["127.0.0.1", "localhost"].includes(host)) {
  throw new Error("DATABASE_URL es local; ahí las migraciones se aplican con npm run db:start o db:reset");
}
console.log(`Base: ${host}`);

const result = spawnSync("npx", ["supabase", "db", "push", "--db-url", databaseUrl, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exitCode = result.status ?? 1;
