import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/account/validation";
import { devLoginEnabled } from "@/supabase/admin";
import { getCurrentProfile } from "@/supabase/session";
import { DevLogin } from "./dev-login";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Mazo" };

<<<<<<< HEAD

export default async function EntrarPage() {
  if (await getCurrentProfile()) redirect("/mainpage");
=======
export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { error, siguiente } = await searchParams;
  const next = safeNextPath(siguiente, "") || undefined;
  if (await getCurrentProfile()) redirect(next ?? "/cuenta");
>>>>>>> daeac65 (quack)

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm opacity-70">Si es tu primera vez, con esto mismo se crea tu cuenta.</p>
      </div>
      {error === "enlace" && (
        <p className="text-sm text-red-600" role="alert">
          El enlace no es válido o ya venció. Pide un código nuevo.
        </p>
      )}
      <LoginForm next={next} />
      {devLoginEnabled() && <DevLogin next={next} />}
    </main>
  );
}
