import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 🔥 AQUÍ AGREGAS TODOS LOS DEL MUNDO:
  locales: ['es', 'en', 'pt', 'fr', 'de', 'ru', 'ja', 'hi', 'zh'], 
  defaultLocale: 'es', 
  localePrefix: 'always' 
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};