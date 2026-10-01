"use client";

import { useActionState, useState } from "react";
import { ui } from "@/app/ui";
import { MAX_RATING_COMMENT } from "@/lib/offers/offers";
import { type OfferActionState, rateOffer } from "./actions";

/** Calificar a la otra parte después del trato: 1 a 5 estrellas y un comentario opcional. */
export function RatingForm({ offerId, otherName }: { offerId: string; otherName: string }) {
  const [state, action, pending] = useActionState<OfferActionState, FormData>(rateOffer.bind(null, offerId), {});
  const [score, setScore] = useState(0);

  return (
    <form action={action} className="flex flex-col gap-2 border-t border-line-soft pt-3">
      <p className={ui.label}>¿Cómo te fue con {otherName}?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={`${n} de 5`}
            onClick={() => setScore(n)}
            className={`text-xl leading-none transition ${n <= score ? "text-accent-soft" : "text-muted/40 hover:text-muted"}`}
          >
            ★
          </button>
        ))}
      </div>
      <input type="hidden" name="score" value={score || ""} />
      <textarea
        name="comment"
        rows={2}
        maxLength={MAX_RATING_COMMENT}
        placeholder="Comentario (opcional)"
        className={ui.input}
      />
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending || score === 0} className={`${ui.buttonSecondary} self-start`}>
        {pending ? "Guardando…" : "Calificar"}
      </button>
    </form>
  );
}
