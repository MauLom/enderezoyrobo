import Link from "next/link";
import { Brand } from "@/app/_components/brand";
import { ui } from "@/app/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="public-topbar">
        <Brand />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
        <div className="eyebrow"><span /> 404</div>
        <h1 className="text-3xl font-extrabold tracking-[-.035em]">No encontramos esta página.</h1>
        <p className={ui.muted}>Puede que la lista sea privada, que la hayan borrado o que el enlace esté mal.</p>
        <Link href="/" className={`${ui.button} self-start`}>Ir al inicio</Link>
      </main>
    </div>
  );
}
