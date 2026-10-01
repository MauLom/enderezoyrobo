"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { type LoginState, login } from "./actions";

const input = ui.input;
const button = `${ui.button} h-11 w-full text-sm`;
const textButton = "text-xs font-bold text-accent-soft transition hover:text-ink disabled:opacity-50";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { step: "email" });

  if (state.step === "email") {
    return (
      <form key="email" action={action} className="flex flex-col gap-3">
        {next && <input type="hidden" name="next" value={next} />}
        <label htmlFor="email" className={ui.label}>
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          className={input}
        />
        {state.error && (
          <p className={ui.error} role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" name="intent" value="send" disabled={pending} className={button}>
          {pending ? "Enviando…" : "Mandar código"}
        </button>
        <p className={ui.muted}>Te mandamos un código de 6 dígitos. No necesitas contraseña.</p>
      </form>
    );
  }

  return (
    <form key="code" action={action} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <p className="text-sm text-muted">
        Mandamos un código a <strong className="text-ink">{state.email}</strong>. Revisa también la carpeta de spam.
      </p>
      <input type="hidden" name="email" value={state.email} />
      <label htmlFor="code" className={ui.label}>
        Código
      </label>
      <input
        id="code"
        name="code"
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={7}
        autoFocus
        className={`${input} text-center text-lg font-bold tracking-[0.4em]`}
      />
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" name="intent" value="verify" disabled={pending} className={button}>
        {pending ? "Verificando…" : "Entrar"}
      </button>
      <div className="flex justify-between">
        <button type="submit" name="intent" value="send" disabled={pending} className={textButton}>
          Mandar otro código
        </button>
        <button type="submit" name="intent" value="restart" disabled={pending} className={textButton}>
          Usar otro correo
        </button>
      </div>
    </form>
  );
}
