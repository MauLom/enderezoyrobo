import Link from "next/link";
import { ui } from "./ui";

const STEPS = [
  ["Pega tu want list", "Tal como la exportas de Moxfield, Arena o ManaBox. Una carta por línea."],
  ["Ve quién la tiene", "Qué tiendas y vendedores de Monterrey tienen tus cartas, en qué condición y a qué precio."],
  ["Pide por WhatsApp", "Te armamos el mensaje con las cartas y el total. El trato lo cierras directo con la tienda."],
] as const;

export default function Home() {
  return (
    <main className={`${ui.page} justify-center py-16`}>
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          ¿Qué tiendas de Monterrey tienen las cartas que buscas?
        </h1>
        <p className="text-lg">
          Sube tu want list una vez y compara inventarios con precios de referencia en MXN, lado a lado.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/listas/nueva" className={ui.button}>
            Armar mi want list
          </Link>
          <span className={ui.muted}>Gratis para jugadores. Por ahora, solo Magic: The Gathering.</span>
        </div>
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(([title, body], index) => (
          <li key={title} className={ui.card}>
            <p className="text-sm opacity-60">{index + 1}</p>
            <p className="font-medium">{title}</p>
            <p className={`${ui.muted} mt-1`}>{body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
