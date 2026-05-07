import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

// 🌍 1. Motor de Idiomas (🔥 RUTA EXACTA SEGÚN TU FOTO)
const withNextIntl = createNextIntlPlugin('./i18n/i18n.ts'); 

// 📱 2. Motor de la PWA (App Nativa)
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, 
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
  },
};

// 🚀 3. FUSIÓN DE MOTORES
export default withPWA(withNextIntl(nextConfig));