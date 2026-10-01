import Link from "next/link";
import { Brand } from "@/app/_components/brand";

/** Landing y entrar: sin menú lateral, con la misma identidad que la plataforma. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="public-topbar">
        <Brand />
        <Link href="/entrar" className="publish-button">Entrar</Link>
      </header>
      {children}
    </div>
  );
}
