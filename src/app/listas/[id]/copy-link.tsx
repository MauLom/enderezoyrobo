"use client";

import { useState } from "react";

/** Copia la URL de la página actual para pegarla en grupos de WhatsApp o Facebook. */
export function CopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="text-sm underline underline-offset-2"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "¡Enlace copiado!" : "Copiar enlace para compartir"}
    </button>
  );
}
