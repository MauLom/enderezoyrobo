"use client";

import { useActionState, useRef, useState } from "react";
import { ui } from "@/app/ui";
import type { InventoryIssue } from "@/lib/import/store-inventory";
import { type InventoryState, inventoryAction } from "./actions";

const EXAMPLE = `carta,set,numero,condicion,idioma,foil,cantidad,precio
Sol Ring,C21,263,NM,Inglés,No,3,45`;

const where = (issue: InventoryIssue) => (issue.rowNumber === null ? "Archivo" : `Línea ${issue.rowNumber}`);

/** Subir el CSV, revisar lo reconocido y confirmar. Confirmar reemplaza todo el inventario. */
export function InventoryForm({ hasInventory }: { hasInventory: boolean }) {
  const [state, action, pending] = useActionState<InventoryState, FormData>(inventoryAction, { text: "" });
  const preview = state.preview;
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [fileName, setFileName] = useState<string | null>(state.fileName ?? null);

  async function loadCsv(file: File | undefined) {
    if (!file || !textRef.current) return;
    textRef.current.value = await file.text();
    setFileName(file.name);
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className={`${ui.card} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${ui.button} cursor-pointer`}>
            Subir CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                void loadCsv(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <a href="/plantilla-inventario.csv" download className={ui.buttonSecondary}>
            Descargar plantilla
          </a>
          {fileName && <span className={`${ui.muted} break-all`}>Cargamos {fileName}. Pulsa &quot;Revisar inventario&quot;.</span>}
        </div>
        <input type="hidden" name="fileName" value={fileName ?? ""} />
        <details>
          <summary className={`${ui.link} cursor-pointer text-xs`}>O pega el contenido del CSV</summary>
          <textarea
            ref={textRef}
            name="text"
            rows={8}
            defaultValue={state.text}
            placeholder={EXAMPLE}
            className={`${ui.input} mt-2 font-mono text-[12px] leading-relaxed`}
          />
        </details>
        <p className={ui.muted}>
          Columnas: <code className="text-accent-text">carta, set, numero, condicion, idioma, foil, cantidad, precio</code>.
          Solo carta, cantidad y precio (en pesos) son obligatorias; sin set usamos la impresión más reciente. Abre la
          plantilla en Excel o Google Sheets y guárdala como CSV.
        </p>
      </div>

      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state.saved !== undefined && !pending && (
        <p className={ui.success} role="status">
          Listo: tu inventario quedó con {state.saved === 1 ? "1 carta distinta" : `${state.saved} cartas distintas`}. Ya
          aparece en el marketplace y en el matching.
        </p>
      )}

      {preview && (
        <section className="flex flex-col gap-3" aria-live="polite">
          <h2 className={ui.h2}>
            Reconocimos {preview.copies === 1 ? "1 carta" : `${preview.copies} cartas`} ({preview.distinct} distintas)
          </h2>

          {preview.errors.length > 0 && (
            <div className={ui.boxError}>
              <p className="font-bold text-danger">
                {preview.errors.length === 1 ? "1 error" : `${preview.errors.length} errores`}: corrígelos en el archivo y
                vuelve a subirlo. No guardamos nada mientras haya errores.
              </p>
              <ul className="mt-1 list-disc pl-5">
                {preview.errors.map((e, i) => (
                  <li key={i}>
                    {where(e)}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <details className={ui.boxWarn} open={preview.warnings.length <= 5}>
              <summary className="cursor-pointer font-bold text-warn">
                {preview.warnings.length === 1 ? "1 aviso" : `${preview.warnings.length} avisos`}: se guardan, pero revisa
                que sean tus impresiones
              </summary>
              <ul className="mt-1 list-disc pl-5">
                {preview.warnings.map((w, i) => (
                  <li key={i}>
                    {where(w)}: {w.message}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {preview.items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 rounded-lg border border-line bg-paper p-2">
                {item.imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imágenes de Scryfall sin optimizador
                  <img src={item.imageUri} alt="" width={40} height={56} className={ui.cardThumb} loading="lazy" />
                ) : (
                  <div className={`h-14 w-10 shrink-0 ${ui.thumbPlaceholder}`} />
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <p className="truncate font-bold">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="truncate text-muted">{item.detail}</p>
                </div>
                <b className="whitespace-nowrap text-xs text-accent-soft">{item.price}</b>
              </li>
            ))}
          </ul>
          {preview.distinct > preview.items.length && (
            <p className={ui.muted}>Y {preview.distinct - preview.items.length} cartas distintas más.</p>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" name="intent" value="review" disabled={pending} className={preview ? ui.buttonSecondary : ui.button}>
          {pending ? "Revisando…" : preview ? "Volver a revisar" : "Revisar inventario"}
        </button>
        {preview && preview.errors.length === 0 && preview.distinct > 0 && (
          <button type="submit" name="intent" value="save" disabled={pending} className={ui.button}>
            {hasInventory ? "Reemplazar mi inventario" : "Guardar inventario"}
          </button>
        )}
        {preview && hasInventory && preview.errors.length === 0 && (
          <p className={ui.muted}>Reemplaza todo lo que tienes cargado hoy por lo de este archivo.</p>
        )}
      </div>
    </form>
  );
}
