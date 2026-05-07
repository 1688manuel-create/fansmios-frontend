"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// 🔥 IMPORTAMOS ICONOS PREMIUM Y MINIMALISTAS
import { 
  Home, 
  Compass, 
  MessageCircle, 
  Radio, 
  Wallet, 
  ShieldCheck, 
  Lock, 
  User, 
  Crown, 
  LogOut,
  TrendingUp, 
  Ticket,
  Settings,
  Menu, // <-- Icono extra por si en el futuro agregas un menú "Más"
  PlaySquare // 🎬 NUEVO ÍCONO PARA LA ACADEMIA VIP
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Sidebar'); // 👈 AGREGAR ESTA LÍNEA AQUÍ

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 📻 RADAR COVRA PAY: Escucha los gastos en tiempo real
  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      const nuevoSaldo = e.detail;
      setUser((prev: any) => {
        if (!prev) return prev;
        return { ...prev, walletBalance: nuevoSaldo };
      });
    };

    window.addEventListener('covraPayBalanceUpdate', handleBalanceUpdate);
    return () => window.removeEventListener('covraPayBalanceUpdate', handleBalanceUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/auth');
  };

  if (!user) return null;

  // 🚀 LISTA MAESTRA DE RUTAS (PARA PC)
  const allLinks = [
    { name: t('nav_feed'), href: '/feed', icon: Home, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: t('nav_explore'), href: '/explore', icon: Compass, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: t('nav_messages'), href: '/dashboard/messages', icon: MessageCircle, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: t('nav_live'), href: '/dashboard/live', icon: Radio, roles: ['CREATOR', 'ADMIN'] },
    
    // 🎓 NUEVA RUTA TÁCTICA: ACADEMIA VIP
    { name: t('nav_academy'), href: '/dashboard/series', icon: PlaySquare, roles: ['CREATOR', 'ADMIN'] },
    
    // 🔥 BOTONES FINANCIEROS 
    { name: t('nav_stats'), href: '/dashboard/analytics', icon: TrendingUp, roles: ['CREATOR', 'ADMIN'] },
    { name: t('nav_coupons'), href: '/dashboard/coupons', icon: Ticket, roles: ['CREATOR', 'ADMIN'] }, 
    
    { name: t('nav_wallet'), href: '/dashboard/wallet', icon: Wallet, roles: ['CREATOR', 'ADMIN'] },
    { name: t('nav_kyc'), href: '/dashboard/kyc', icon: ShieldCheck, roles: ['CREATOR', 'ADMIN'] },
    { name: t('nav_2fa'), href: '/dashboard/security', icon: Lock, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: t('nav_profile'), href: `/${user.username || 'perfil'}`, icon: User, roles: ['FAN', 'CREATOR', 'ADMIN'] },
  ];

  const allowedLinks = allLinks.filter(link => link.roles.includes(user.role));

  // 📱 LISTA ESPECÍFICA PARA EL MENÚ INFERIOR DE CELULAR (Instagram Style)
  const mobileLinks = [
    { name: t('nav_feed'), href: '/feed', icon: Home },
    { name: t('nav_explore'), href: '/explore', icon: Compass },
    // El botón central cambia si eres creador (Transmitir) o Fan (Mensajes)
    user.role === 'CREATOR' || user.role === 'ADMIN' 
        ? { name: t('nav_live'), href: '/dashboard/live', icon: Radio, isCenter: true }
        : { name: t('nav_messages'), href: '/dashboard/messages', icon: MessageCircle, isCenter: true },
    { name: t('nav_messages'), href: '/dashboard/messages', icon: MessageCircle }, // (Ocultaremos este en CSS si el de arriba ya es mensajes)
    { name: t('nav_profile'), href: `/${user.username || 'perfil'}`, icon: User }
  ];

  // Filtramos para asegurar que no haya duplicados (ej: 2 iconos de mensajes)
  const finalMobileLinks = user.role === 'FAN' 
    ? mobileLinks.filter((l, i) => i !== 3) // Fan ve: Feed, Explorar, Mensajes(Centro), Perfil
    : mobileLinks.slice(0, 5);              // Creador ve: Feed, Explorar, Transmitir(Centro), Mensajes, Perfil

  return (
    <>
      {/* 💻 SIDEBAR PARA COMPUTADORAS (Se mantiene igual, estaba perfecto) */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-nm-base border-r border-white/5 z-50 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        
        <div className="p-6 pb-2">
          <Link href="/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]">⚡</span>
            <span className="text-2xl font-black tracking-tighter text-white">FansMio</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-6 overflow-y-auto custom-scrollbar pb-6">
          {allowedLinks.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/feed' && link.href !== '/explore');
            const Icon = link.icon; 

            return (
              <Link 
                key={link.name} 
                href={link.href}
                prefetch={true} // 🔥 NITRO ACTIVADO PARA PC
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'nm-inset text-teal-500 shadow-[inset_0_0_10px_rgba(20,184,166,0.1)] border border-teal-500/20' 
                    : 'nm-btn text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]' : ''}`} strokeWidth={2.5} />
                <span className="text-sm tracking-wide">{link.name}</span>
              </Link>
            );
          })}

          {/* 👑 SECCIÓN MODO DIOS (ADMIN) */}
          {user.role === 'ADMIN' && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 px-4">{t('admin_command_center')}</p>
              
              {/* Botón Principal Admin (Usuarios/Stats) */}
              <Link 
                href="/dashboard/admin"
                prefetch={true} // 🔥 NITRO ACTIVADO
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                  pathname === '/dashboard/admin' ? 'nm-inset text-red-500' : 'nm-btn text-red-500/80 hover:text-red-400'
                }`}
              >
                <Crown className="w-5 h-5" />
                <span className="text-sm">{t('admin_god_mode')}</span>
              </Link>

              {/* 💸 Botón de Payouts (Pagos) */}
              <Link 
                href="/admin/payouts"
                prefetch={true} // 🔥 NITRO ACTIVADO
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                  pathname === '/admin/payouts' ? 'nm-inset text-orange-500' : 'nm-btn text-orange-500/80 hover:text-orange-400'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-sm">{t('admin_payouts')}</span>
              </Link>

              {/* ⚙️ NUEVO: Botón de Configuración (Mensajes de Bienvenida) */}
              <Link 
                href="/admin/settings"
                prefetch={true} // 🔥 NITRO ACTIVADO
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                  pathname === '/admin/settings' ? 'nm-inset text-purple-500' : 'nm-btn text-purple-500/80 hover:text-purple-400'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">{t('admin_settings')}</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 bg-nm-base/80 backdrop-blur-md border-t border-white/5 pb-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 nm-btn font-bold text-gray-500 hover:text-red-500 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all" strokeWidth={2.5} />
            <span className="text-sm">{t('btn_logout')}</span>
          </button>
        </div>
      </aside>

      {/* 📱 BOTTOM NAV PARA CELULARES (REDISEÑO GLASSMORPHISM) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 pointer-events-none">
        
        {/* El Bloque de Cristal */}
        <div className="bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex justify-around items-center px-2 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto">
          
          {finalMobileLinks.map((link: any, index: number) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/feed' && link.href !== '/explore');
            const Icon = link.icon;

            return (
              <Link 
                key={`${link.name}-${index}`} 
                href={link.href}
                prefetch={true} // 🔥 NITRO ACTIVADO PARA CELULARES
                className="relative flex flex-col items-center justify-center w-14 h-12 transition-all group"
              >
                {/* 🔥 EL BOTÓN CENTRAL (Jerarquía VIP) */}
                {link.isCenter ? (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                    isActive 
                      ? 'bg-gradient-to-tr from-red-600 to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
                      : 'bg-red-500/10 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-500/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]'}`} strokeWidth={isActive ? 3 : 2.5} />
                  </div>
                ) : (
                  /* 🔘 ÍCONOS NORMALES (Mejorada la visibilidad) */
                  <>
                    <Icon 
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive 
                          ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] scale-110' 
                          // 🔥 CORRECCIÓN: Cambiamos text-gray-500 por text-gray-400 para que se vean bien
                          : 'text-gray-400 group-hover:text-gray-200' 
                      }`} 
                      strokeWidth={isActive ? 3 : 2.5} 
                    />
                    {/* Puntito indicador activo */}
                    {isActive && (
                      <span className="absolute -bottom-1.5 w-1 h-1 bg-teal-400 rounded-full shadow-[0_0_5px_rgba(20,184,166,0.8)]"></span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}