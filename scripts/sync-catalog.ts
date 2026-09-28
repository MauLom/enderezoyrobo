/**
 * Sincronización diaria del catálogo, precios de referencia y tipo de cambio.
 * Corre en GitHub Actions (.github/workflows/sincronizar-catalogo.yml) o local:
 *
 *   npm run sync:catalogo                      # descarga el bulk de Scryfall
 *   npm run sync:catalogo -- ruta/al.jsonl.gz  # usa un archivo ya descargado
 *
 * Variables de entorno:
 *   DATABASE_URL   conexión directa a Postgres (se salta RLS). Obligatoria.
 *   BANXICO_TOKEN  token de la API SIE de Banxico. Sin él no se actualiza el tipo de cambio.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { createGunzip } from "node:zlib";
import postgres from "postgres";
import { banxicoUrl, parseBanxico } from "@/lib/catalog/banxico";
import { type PriceRow, type PrintingRow, type ScryfallCard, toPrices, toPrinting } from "@/lib/catalog/scryfall";

// Scryfall pide identificarse con User-Agent y Accept. El User-Agent debe ser
// ASCII: con acentos Scryfall responde 403.
const SCRYFALL_HEADERS = { "User-Agent": "MazoTCG/0.1", Accept: "application/json" };
const BATCH_SIZE = 1000;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Falta DATABASE_URL");

const sql = postgres(databaseUrl, { transform: postgres.camel, max: 1, onnotice: () => {} });

async function openBulk(localPath: string | undefined): Promise<{ stream: Readable; asOf: string }> {
  if (localPath) {
    return { stream: createReadStream(localPath).pipe(createGunzip()), asOf: new Date().toISOString().slice(0, 10) };
  }

  const meta = await fetch("https://api.scryfall.com/bulk-data/default-cards", { headers: SCRYFALL_HEADERS });
  if (!meta.ok) throw new Error(`Scryfall respondió ${meta.status} al pedir el bulk`);
  const { jsonl_download_uri: uri, updated_at: updatedAt } = (await meta.json()) as {
    jsonl_download_uri: string;
    updated_at: string;
  };

  const file = await fetch(uri, { headers: SCRYFALL_HEADERS });
  if (!file.ok || !file.body) throw new Error(`Scryfall respondió ${file.status} al descargar ${uri}`);
  console.log(`Descargando ${uri}`);
  return { stream: Readable.fromWeb(file.body as NodeReadableStream).pipe(createGunzip()), asOf: updatedAt.slice(0, 10) };
}

async function upsertBatch(printings: PrintingRow[], prices: PriceRow[]) {
  if (printings.length > 0) {
    // El where evita reescribir filas sin cambios: menos escrituras y menos espacio muerto.
    await sql`
      insert into card_printing ${sql(printings)}
      on conflict (id) do update set
        oracle_id = excluded.oracle_id,
        name = excluded.name,
        set_code = excluded.set_code,
        set_name = excluded.set_name,
        collector_number = excluded.collector_number,
        lang = excluded.lang,
        rarity = excluded.rarity,
        image_uri = excluded.image_uri,
        released_at = excluded.released_at,
        updated_at = now()
      where (card_printing.oracle_id, card_printing.name, card_printing.set_code, card_printing.set_name,
             card_printing.collector_number, card_printing.lang, card_printing.rarity,
             card_printing.image_uri, card_printing.released_at)
        is distinct from
            (excluded.oracle_id, excluded.name, excluded.set_code, excluded.set_name,
             excluded.collector_number, excluded.lang, excluded.rarity,
             excluded.image_uri, excluded.released_at)
    `;
  }
  if (prices.length > 0) {
    await sql`
      insert into price_reference ${sql(prices)}
      on conflict (printing_id, source, finish) do update set
        currency = excluded.currency,
        amount = excluded.amount,
        as_of = excluded.as_of
    `;
  }
}

async function syncScryfall(localPath: string | undefined) {
  const { stream, asOf } = await openBulk(localPath);
  let printings: PrintingRow[] = [];
  let prices: PriceRow[] = [];
  let total = 0;
  let skipped = 0;

  for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
    if (!line.trim()) continue;
    const card = JSON.parse(line) as ScryfallCard;
    const printing = toPrinting(card);
    if (!printing) {
      skipped++;
      continue;
    }
    printings.push(printing);
    prices.push(...toPrices(card, asOf));

    if (printings.length >= BATCH_SIZE) {
      await upsertBatch(printings, prices);
      total += printings.length;
      printings = [];
      prices = [];
      if (total % 20000 === 0) console.log(`  ${total} impresiones`);
    }
  }
  await upsertBatch(printings, prices);
  total += printings.length;

  // Precios que Scryfall ya no reporta: se borran para no mostrar valores viejos.
  const stale = await sql`
    delete from price_reference
    where source in ('tcgplayer', 'cardmarket') and as_of < ${asOf}
  `;
  console.log(`Scryfall: ${total} impresiones, ${skipped} omitidas, ${stale.count} precios viejos borrados (fecha ${asOf})`);
}

async function syncExchangeRates() {
  const token = process.env.BANXICO_TOKEN;
  if (!token) {
    console.warn("Sin BANXICO_TOKEN: no se actualiza el tipo de cambio");
    return;
  }
  const res = await fetch(banxicoUrl(), { headers: { "Bmx-Token": token, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Banxico respondió ${res.status}`);
  const rows = parseBanxico(await res.json());
  if (rows.length === 0) {
    console.warn("Banxico no devolvió datos de tipo de cambio");
    return;
  }
  await sql`
    insert into exchange_rate ${sql(rows)}
    on conflict (currency) do update set mxn_per_unit = excluded.mxn_per_unit, as_of = excluded.as_of
  `;
  console.log(`Tipo de cambio: ${rows.map((r) => `${r.currency} ${r.mxnPerUnit} (${r.asOf})`).join(", ")}`);
}

async function main() {
  try {
    await syncScryfall(process.argv[2]);
    await syncExchangeRates();
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
