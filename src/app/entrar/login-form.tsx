"use client";

import { useActionState } from "react";
import { type LoginState, login } from "./actions";

const input =
  "w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-base outline-none focus:border-foreground/60";
const button = "w-full rounded-md bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { step: "email" });

  if (state.step === "email") {
    return (
      <form key="email" action={action} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium">
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
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" name="intent" value="send" disabled={pending} className={button}>
          {pending ? "Enviando…" : "Mandar código"}
        </button>
        <p className="text-sm opacity-70">Te mandamos un código de 6 dígitos. No necesitas contraseña.</p>
      </form>
    );
  }

  return (
    <form key="code" action={action} className="flex flex-col gap-3">
      <p className="text-sm">
        Mandamos un código a <strong>{state.email}</strong>. Revisa también la carpeta de spam.
      </p>
      <input type="hidden" name="email" value={state.email} />
      <label htmlFor="code" className="text-sm font-medium">
        Código
      </label>
      <input
        id="code"
        name="code"
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={7}
        autoFocus
        className={`${input} tracking-[0.4em]`}
      />
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" name="intent" value="verify" disabled={pending} className={button}>
        {pending ? "Verificando…" : "Entrar"}
      </button>
      <div className="flex justify-between text-sm">
        <button type="submit" name="intent" value="send" disabled={pending} className="underline opacity-70">
          Mandar otro código
        </button>
        <button type="submit" name="intent" value="restart" disabled={pending} className="underline opacity-70">
          Usar otro correo
        </button>
      </div>
    </form>
  );
}
