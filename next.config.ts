import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 🔥 EL PUENTE MAESTRO: Conecta el motor de Next.js con tu archivo i18n
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* Aquí podrás agregar configuraciones futuras de caché, imágenes o CORS */
};

// Envuelve toda la configuración de tu app con el poder del multi-idioma
export default withNextIntl(nextConfig);