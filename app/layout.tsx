import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FansMio VIP",
  description:
    "La plataforma exclusiva para creadores de élite. Tu contenido. Tus reglas. Tus fans.",
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "FaGtag_Iz-NRoRwVB-0qvxkeM4-7lFDKy4SmAmJULhY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}