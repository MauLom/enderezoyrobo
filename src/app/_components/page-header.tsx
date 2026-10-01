import type { ReactNode } from "react";

/** Encabezado de página con el estilo del marketplace: etiqueta, título, descripción y acciones. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="welcome">
      <div className="min-w-0">
        <div className="eyebrow"><span /> {eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </section>
  );
}
