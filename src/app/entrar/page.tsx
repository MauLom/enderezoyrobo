import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/supabase/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Mazo" };

export default async function EntrarPage() {
  if (await getCurrentProfile()) redirect("/cuenta");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm opacity-70">Si es tu primera vez, con esto mismo se crea tu cuenta.</p>
      </div>
      <LoginForm />
    </main>
  );
}
