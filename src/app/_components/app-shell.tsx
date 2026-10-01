"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { signOut } from "@/app/(app)/cuenta/actions";
import { ACCOUNT_KINDS, type AccountKind } from "@/lib/account/kind";
import { initials } from "@/lib/marketplace/listings";
import type { ShellCounts } from "@/supabase/shell";
import { Brand } from "./brand";
import { Icon } from "./icon";

type Props = {
  user: { displayName: string; email: string | null; kind: AccountKind } | null;
  counts: ShellCounts;
  children: ReactNode;
};

/**
 * La búsqueda filtra el marketplace con ?q=. En /dashboard actualiza la URL
 * sin volver a pedir la página; en otras rutas lleva al marketplace al enviar.
 */
export function AppShell({ user, counts, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const onMarketplace = pathname === "/dashboard";
  const section = pathname.startsWith("/listas") ? "listas" : pathname === "/dashboard" ? "marketplace" : null;
  const userInitials = user ? initials(user.displayName) : null;

  function updateSearch(value: string) {
    setSearch(value);
    if (onMarketplace) {
      const q = value.trim();
      window.history.replaceState(null, "", q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <form
          className="global-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const q = search.trim();
            if (!onMarketplace) router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
          }}
        >
          <Icon name="search" size={18} />
          <input
            aria-label="Buscar cartas en el marketplace"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Busca una carta..."
          />
        </form>
        <div className="header-actions">
          {user ? (
            <>
              <Link href="/listas/nueva" className="publish-button"><Icon name="plus" size={18} /> Nueva want list</Link>
              <Link href="/cuenta" className="icon-button profile-button" aria-label="Mi cuenta">{userInitials}</Link>
            </>
          ) : (
            <Link href={`/entrar?siguiente=${encodeURIComponent(pathname)}`} className="publish-button">Entrar</Link>
          )}
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          <div className="nav-label">Explorar</div>
          <Link href="/dashboard" className={`nav-item ${section === "marketplace" ? "active" : ""}`}>
            <Icon name="store" size={19} /><span>Marketplace</span>
          </Link>
          <Link href="/listas" className={`nav-item ${section === "listas" ? "active" : ""}`}>
            <Icon name="heart" size={19} /><span>Mis listas</span>
            {counts.lists > 0 && <b>{counts.lists}</b>}
          </Link>
          <span className="nav-item soon" aria-disabled="true" title="Fuera del MVP">
            <Icon name="users" size={19} /><span>Comunidad</span><b>Pronto</b>
          </span>
          <span className="nav-item soon" aria-disabled="true" title="Los tratos se cierran por WhatsApp">
            <Icon name="message" size={19} /><span>Mensajes</span><b>Pronto</b>
          </span>
          {user && (
            <>
              <div className="nav-label">Cuenta</div>
              <Link href="/cuenta" className={`nav-item ${pathname === "/cuenta" ? "active" : ""}`}>
                <Icon name="user" size={19} /><span>Mi perfil</span>
              </Link>
              <form action={signOut}>
                <button type="submit" className="nav-item">
                  <Icon name="logout" size={19} /><span>Salir</span>
                </button>
              </form>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <div className="local-icon"><Icon name="map" size={20} /></div>
            <strong>Comunidad MTY</strong>
            <p>
              {counts.verifiedStores === 1 ? "1 tienda verificada" : `${counts.verifiedStores} tiendas verificadas`} en
              Monterrey. Los tratos se cierran por WhatsApp o en tienda.
            </p>
          </div>
          {user ? (
            <Link href="/cuenta" className={`user-row ${pathname === "/cuenta" ? "active" : ""}`}>
              <div className="avatar">{userInitials}</div>
              <div>
                <strong>{user.displayName}</strong>
                <span className="user-kind">{ACCOUNT_KINDS[user.kind].label}</span>
                {user.email && <span>{user.email}</span>}
              </div>
              <span className="more">•••</span>
            </Link>
          ) : (
            <Link href={`/entrar?siguiente=${encodeURIComponent(pathname)}`} className="user-row">
              <div className="avatar"><Icon name="user" size={16} /></div>
              <div><strong>Entrar</strong><span>Gratis para jugadores</span></div>
            </Link>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
