import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/app/_components/icon";
import { ui } from "@/app/ui";
import { HOME_PATH } from "@/lib/account/validation";
import { getCurrentProfile } from "@/supabase/session";

const STEPS = [
  ["Pega tu want list", "Tal como la exportas de Moxfield, Arena o ManaBox. Una carta por línea."],
  ["Ve quién la tiene", "Qué tiendas y vendedores de Monterrey tienen tus cartas, en qué condición y a qué precio."],
  ["Pide por WhatsApp", "Te armamos el mensaje con las cartas y el total. El trato lo cierras directo con la tienda."],
] as const;

export default async function Home() {
  if (await getCurrentProfile()) redirect(HOME_PATH);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-4 py-16 sm:px-8">
      <section className="flex max-w-3xl flex-col gap-5">
        <div className="eyebrow"><span /> MARKETPLACE LOCAL · MONTERREY</div>
        <h1 className="text-4xl font-extrabold tracking-[-.035em] sm:text-5xl">
          ¿Qué tiendas de Monterrey tienen las cartas que buscas?
        </h1>
        <p className="text-base text-muted">
          Sube tu want list una vez y compara inventarios con precios de referencia en MXN, lado a lado.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/listas/nueva" className={`${ui.button} h-11 px-5 text-sm`}>
            <Icon name="plus" size={18} /> Armar mi want list
          </Link>
          <span className={ui.muted}>Gratis para jugadores. Por ahora, solo Magic: The Gathering.</span>
        </div>
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(([title, body], index) => (
          <li key={title} className={`${ui.card} flex flex-col gap-2`}>
            <span className="grid size-8 place-items-center rounded-full bg-accent-pale text-xs font-extrabold text-accent-soft">
              {index + 1}
            </span>
            <p className={ui.h3}>{title}</p>
            <p className={ui.muted}>{body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
