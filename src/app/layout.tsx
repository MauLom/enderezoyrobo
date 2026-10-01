import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./plataforma.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mazo",
  description: "Sube tu want list y ve qué tiendas de Monterrey tienen tus cartas y a qué precio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
