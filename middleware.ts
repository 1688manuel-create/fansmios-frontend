import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Mismos idiomas globales:
  locales: ['es', 'en', 'pt', 'fr', 'de', 'ru', 'ja', 'hi', 'zh', 'ar', 'ko', 'it'], 
  defaultLocale: 'es', 
  
  // 🔥 TRUCO PRO: 'as-needed' hace que fansmio.com sea la versión en español sin agregar el "/es".
  // Para los demás sí pondrá "/en", "/pt", etc. ¡A Google le encanta esto para el SEO!
  localePrefix: 'as-needed' 
});

export const config = {
  // Tu filtro es perfecto, lo dejamos igual:
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};