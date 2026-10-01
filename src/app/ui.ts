/**
 * Clases de Tailwind compartidas entre pantallas, con la identidad de la
 * plataforma (tokens en globals.css). Lo propio del shell y del marketplace
 * vive en plataforma.css.
 */
export const ui = {
  page: "flex w-full flex-col gap-7",
  narrow: "flex w-full max-w-xl flex-col gap-7",
  h2: "text-[17px] font-extrabold tracking-tight",
  h3: "text-sm font-bold",
  muted: "text-xs text-muted",
  label: "text-[11px] font-bold uppercase tracking-[.08em] text-muted",
  input:
    "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-3 focus:ring-accent-pale",
  select: "rounded-md border border-line bg-canvas px-2 py-1.5 text-xs text-ink outline-none focus:border-accent",
  button:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white shadow-[0_3px_10px_rgba(139,92,246,.25)] transition hover:bg-accent-soft disabled:opacity-50",
  buttonSecondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-accent-border bg-accent-pale px-4 text-xs font-bold text-accent-text transition hover:border-accent disabled:opacity-50",
  buttonDanger:
    "inline-flex h-9 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 px-3 text-xs font-bold text-danger transition hover:bg-danger/20 disabled:opacity-50",
  buttonSmall: "h-8 px-3",
  link: "font-bold text-accent-soft transition hover:text-ink",
  card: "rounded-xl border border-line bg-paper p-5",
  badge: "inline-flex items-center rounded-full border border-line bg-cream px-2 py-0.5 text-[10px] font-bold text-muted",
  badgeAccent: "inline-flex items-center rounded-full border border-accent-border bg-accent-pale px-2 py-0.5 text-[10px] font-bold text-accent-text",
  badgeWarn: "inline-flex items-center rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-[10px] font-bold text-warn",
  error: "text-xs font-semibold text-danger",
  success: "text-xs font-semibold text-ok",
  boxError: "rounded-lg border border-danger/40 bg-danger/5 p-3 text-xs",
  boxWarn: "rounded-lg border border-warn/40 bg-warn/5 p-3 text-xs",
  cardThumb: "rounded-[4px] shadow-[0_4px_10px_rgba(0,0,0,.35)]",
  thumbPlaceholder: "rounded-[4px] bg-accent-pale",
} as const;
