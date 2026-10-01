/** Clases de Tailwind compartidas entre pantallas. */
export const ui = {
  page: "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10",
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-lg font-semibold",
  muted: "text-sm opacity-70",
  input:
    "w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-base outline-none focus:border-foreground/60",
  select: "rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm",
  button: "rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50",
  buttonSecondary: "rounded-md border border-foreground/30 px-4 py-2 font-medium disabled:opacity-50",
  link: "underline underline-offset-2",
  card: "rounded-lg border border-foreground/15 p-4",
  badge: "rounded-full border border-foreground/20 px-2 py-0.5 text-xs",
  error: "text-sm text-red-600",
} as const;
