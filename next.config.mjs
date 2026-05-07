import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

// 🌍 1. Motor de Idiomas (🔥 CORRECCIÓN AQUÍ 🔥)
// Le decimos EXACTAMENTE cómo se llama y dónde está tu archivo de idiomas.
// NOTA: Si tu archivo i18n.ts está dentro de la carpeta "src", cambia esto a './src/i18n.ts'
const withNextIntl = createNextIntlPlugin('./i18n.ts'); 

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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
  },
};

// 🚀 3. FUSIÓN DE MOTORES
export default withPWA(withNextIntl(nextConfig));