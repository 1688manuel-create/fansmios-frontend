import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 🔥 Lista de idiomas soportados
const locales = ['es', 'en', 'pt', 'fr', 'de', 'ru', 'ja', 'hi', 'zh', 'ar', 'ko', 'it', 'tr', 'id', 'th', 'vi', 'pl', 'nl', 'sv'] as const;

type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // 🛡️ Validación segura
  if (!locale || !locales.includes(locale as Locale)) {
    return {
      locale: 'es',
      messages: (await import(`./messages/es.json`)).default
    };
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;

    return {
      locale,
      messages
    };
  } catch (error) {
    // 🛡️ Fallback si el archivo no existe
    return {
      locale: 'es',
      messages: (await import(`./messages/es.json`)).default
    };
  }
});