import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ui } from "@/app/ui";
import { HOME_PATH, safeNextPath } from "@/lib/account/validation";
import { devLoginEnabled } from "@/supabase/admin";
import { getCurrentProfile } from "@/supabase/session";
import { DevLogin } from "./dev-login";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Mazo" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { error, siguiente } = await searchParams;
  const next = safeNextPath(siguiente, "") || undefined;
  if (await getCurrentProfile()) redirect(next ?? HOME_PATH);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-4 py-16">
      <section className={`${ui.card} flex flex-col gap-6 p-7`}>
        <div className="flex flex-col gap-2">
          <div className="eyebrow"><span /> BIENVENIDO</div>
          <h1 className="text-3xl font-extrabold tracking-[-.035em]">Entrar</h1>
          <p className={ui.muted}>Si es tu primera vez, con esto mismo se crea tu cuenta.</p>
        </div>
        {error === "enlace" && (
          <p className={ui.boxError} role="alert">
            El enlace no es válido o ya venció. Pide un código nuevo.
          </p>
        )}
        <LoginForm next={next} />
      </section>
      {devLoginEnabled() && <DevLogin next={next} />}
    </main>
  );
}
