import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 🔥 MISMOS IDIOMAS AQUÍ:
const locales = ['es', 'en', 'pt', 'fr', 'de', 'ru', 'ja', 'hi', 'zh'];

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale as string, // 👈 Le juramos a TypeScript que sí es texto
    messages: (await import(`./messages/${locale}.json`)).default
  };
});