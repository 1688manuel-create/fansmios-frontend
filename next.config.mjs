import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 LÍNEA NUEVA: Apaga la alerta de Turbopack vs Webpack
  turbopack: {}, 
  
  // (Aquí dejas cualquier otra configuración que ya tuvieras, como images)
};

export default withPWA(nextConfig);