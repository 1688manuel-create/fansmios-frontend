import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css"; // 👈 AQUÍ LLAMAMOS A TUS ESTILOS (TAILWIND)

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

// 🔥 1. IMPORTAMOS EL CEREBRO DEL MODAL UNIVERSAL AQUÍ
// Nota: Revisa que la ruta sea correcta según donde creaste la carpeta 'context'
import { ModalProvider } from "../../src/context/ModalContext"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🌍 METADATA DINÁMICA: Cambia el SEO de Google según el idioma
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon.ico',
    },
    verification: {
      google: 'FaGtag_Iz-NRoRwVB-0qvxkeM4-7lFDKy4SmAmJULhY',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  
  // 1. Extraemos el idioma de forma segura
  const { locale } = await params;

  // 2. Descargamos el diccionario correcto
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 3. Envolvemos la app en el traductor */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          
          {/* 🔥 2. ENVOLVEMOS TODA LA PLATAFORMA CON EL ESCUDO DEL MODAL */}
          <ModalProvider>
            {children}
          </ModalProvider>
          
        </NextIntlClientProvider>
      </body>
    </html>
  );
}