import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    // Salida del build de Cloudflare (OpenNext y wrangler).
    ".open-next/**",
    ".wrangler/**",
    "build/**",
    "next-env.d.ts",
    // Tipos generados por `npm run db:types`.
    "src/supabase/database.types.ts",
  ]),
]);

export default eslintConfig;
