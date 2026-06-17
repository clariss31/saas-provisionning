import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise le serveur de dev à répondre aux requêtes provenant des domaines
  // de tunnel ngrok (exposition publique temporaire du localhost). Sans cela,
  // Next 16 bloque par défaut les assets de dev sollicités depuis une autre
  // origine que « localhost » (« Blocked cross-origin request »).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app"],
  images: {
    // Sert l'AVIF (sensiblement plus léger que le WebP) aux navigateurs
    // compatibles, avec repli WebP automatique. Allège les images de la
    // vitrine — dont l'image LCP du Hero — sans perte visible (audit Lighthouse
    // « Improve image delivery »).
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
