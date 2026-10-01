"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { type NewListState, newListAction } from "../actions";

const EXAMPLE = `1 Sol Ring (C21) 263
1 Atraxa, Praetors' Voice
4 Lightning Bolt
1 Smothering Tithe *F*`;

export function NewListForm() {
  const [state, action, pending] = useActionState<NewListState, FormData>(newListAction, { name: "", text: "" });
  const preview = state.preview;

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <div className={`${ui.card} flex flex-col gap-5`}>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={ui.label}>
          Nombre de la lista
        </label>
        <input id="name" name="name" defaultValue={state.name} placeholder="Mi deck de Commander" className={ui.input} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="text" className={ui.label}>
          Cartas
        </label>
        <textarea
          id="text"
          name="text"
          rows={12}
          defaultValue={state.text}
          placeholder={EXAMPLE}
          className={`${ui.input} font-mono text-[13px] leading-relaxed`}
        />
        <p className={ui.muted}>
          Una carta por línea, como las exporta Moxfield, Arena o ManaBox. Set y número son opcionales: sin ellos
          aceptamos cualquier impresión. <code className="text-accent-text">*F*</code> al final pide foil.
        </p>
      </div>
      </div>

      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}

      {preview && (
        <section className="flex flex-col gap-3" aria-live="polite">
          <h2 className={ui.h2}>
            Reconocimos {preview.items.reduce((s, i) => s + i.quantity, 0)} cartas ({preview.items.length} distintas)
          </h2>

          {preview.problems.length > 0 && (
            <div className={ui.boxError}>
              <p className="font-bold text-danger">Estas líneas no se van a guardar:</p>
              <ul className="mt-1 list-disc pl-5">
                {preview.problems.map((p) => (
                  <li key={p.lineNumber}>
                    Línea {p.lineNumber}: <code>{p.raw.trim()}</code> — {p.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className={ui.boxWarn}>
              <ul className="list-disc pl-5">
                {preview.warnings.map((w) => (
                  <li key={w.lineNumber}>
                    Línea {w.lineNumber}: {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {preview.items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 rounded-lg border border-line bg-paper p-2">
                {item.imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imágenes de Scryfall sin optimizador
                  <img src={item.imageUri} alt="" width={40} height={56} className={ui.cardThumb} loading="lazy" />
                ) : (
                  <div className={`h-14 w-10 ${ui.thumbPlaceholder}`} />
                )}
                <div className="min-w-0 text-xs">
                  <p className="truncate font-bold">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="text-muted">
                    {item.setLabel}
                    {item.foil && " · foil"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="review" disabled={pending} className={preview ? ui.buttonSecondary : ui.button}>
          {pending ? "Revisando…" : preview ? "Volver a revisar" : "Revisar lista"}
        </button>
        {preview && preview.items.length > 0 && (
          <button type="submit" name="intent" value="save" disabled={pending} className={ui.button}>
            Guardar lista
          </button>
        )}
      </div>
    </form>
  );
}
