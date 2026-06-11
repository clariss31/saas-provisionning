import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sert l'AVIF (sensiblement plus léger que le WebP) aux navigateurs
    // compatibles, avec repli WebP automatique. Allège les images de la
    // vitrine — dont l'image LCP du Hero — sans perte visible (audit Lighthouse
    // « Improve image delivery »).
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
