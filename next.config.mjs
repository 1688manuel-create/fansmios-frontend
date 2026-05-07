import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

// 🌍 1. Motor de Idiomas (El que se nos había borrado)
const withNextIntl = createNextIntlPlugin();

// 📱 2. Motor de la PWA (App Nativa)
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // Mantiene a raya el error anterior de compilación
  // Si tenías dominios de imágenes (Cloudinary, etc.), ponlos aquí abajo:
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
  },
};

// 🚀 3. FUSIÓN DE MOTORES: Envolvemos la configuración con los dos escudos
export default withPWA(withNextIntl(nextConfig));