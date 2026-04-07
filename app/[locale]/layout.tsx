import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
// 🔥 1. IMPORTACIONES DEL MOTOR DE IDIOMAS
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'FansMio VIP',
  description: 'La plataforma exclusiva para creadores de élite. Tu contenido. Tus reglas. Tus fans.',
  icons: {
    icon: '/favicon.ico',
  },
  // 🔥 INYECCIÓN DEL RADAR DE GOOGLE:
  verification: {
    google: 'FaGtag_Iz-NRoRwVB-0qvxkeM4-7lFDKy4SmAmJULhY',
  },
}

// 🔥 2. CONVERTIMOS EL LAYOUT EN "ASYNC" Y ATRAPAMOS EL IDIOMA (params)
export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;
  const messages = await getMessages({ locale });
  
  return (
    // 👈 5. LE DECIMOS A GOOGLE EN QUÉ IDIOMA ESTÁ LA PÁGINA
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 🔥 6. ENVOLVEMOS LA APP EN EL CAMPO DE FUERZA DE TRADUCCIÓN */}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
