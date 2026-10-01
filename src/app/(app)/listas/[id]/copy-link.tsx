"use client";

import { useState } from "react";
import { Icon } from "@/app/_components/icon";
import { ui } from "@/app/ui";

/** Copia la URL de la página actual para pegarla en grupos de WhatsApp o Facebook. */
export function CopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={ui.buttonSecondary}
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Icon name="copy" size={14} /> {copied ? "¡Enlace copiado!" : "Copiar enlace"}
    </button>
  );
}
