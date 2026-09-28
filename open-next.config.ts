import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sin caché incremental en R2 por ahora: R2 pide tarjeta registrada y el MVP
// no necesita ISR. Ver https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});
