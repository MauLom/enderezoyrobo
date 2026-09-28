import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes de cartas vienen de Scryfall; no usamos el optimizador de pago.
    unoptimized: true,
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
