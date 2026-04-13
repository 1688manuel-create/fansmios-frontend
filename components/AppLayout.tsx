"use client";

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
// import { useTranslations } from 'next-intl'; // 👈 Listo para usarse si en el futuro agregas texto aquí

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // const t = useTranslations('AppLayout');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');
    // Si hay token, significa que alguien inició sesión
    if (token && token !== "undefined") {
      setIsLoggedIn(true);
    }
  }, []);

  // Evitamos parpadeos de carga
  if (!isMounted) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Nuestro menú lateral inteligente solo aparece si hay sesión */}
      {isLoggedIn && <Sidebar />}
      
      {/* 🚀 MAGIA: Si hay sesión, dejamos margen izquierdo. Si es visitante, centramos todo (w-full) */}
      <main className={`flex-1 pb-20 md:pb-0 relative min-h-screen overflow-x-hidden transition-all duration-300 ${isLoggedIn ? 'md:ml-64' : 'w-full'}`}>
        {children}
      </main>
    </div>
  );
}