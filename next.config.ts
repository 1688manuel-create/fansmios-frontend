import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 🔥 AQUÍ ESTABA MI ERROR. LE FALTABA LA RUTA:
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);