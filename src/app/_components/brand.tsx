import Link from "next/link";

/** Logo de la plataforma; lleva al inicio. */
export function Brand() {
  return (
    <Link href="/" className="brand">
      <div className="brand-mark"><span>M</span></div>
      <div><strong>MAZO</strong><small>MONTERREY</small></div>
    </Link>
  );
}
