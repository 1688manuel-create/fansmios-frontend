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
  TrendingUp, // <-- Para Analytics/Estadísticas
  Ticket      // <-- Para Cupones/Ofertas
} from 'lucide-react';

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/auth');
  };

  if (!user) return null;

  // 🚀 AQUÍ ESTÁ LA MAGIA: LAS RUTAS CORREGIDAS
  const allLinks = [
    { name: 'Feed', href: '/feed', icon: Home, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Explorar', href: '/explore', icon: Compass, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Mensajes', href: '/dashboard/messages', icon: MessageCircle, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Transmitir', href: '/dashboard/live', icon: Radio, roles: ['CREATOR', 'ADMIN'] },
    
    // 🔥 BOTONES FINANCIEROS CORREGIDOS
    { name: 'Estadísticas', href: '/dashboard/analytics', icon: TrendingUp, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Cupones', href: '/dashboard/coupon', icon: Ticket, roles: ['CREATOR', 'ADMIN'] }, 
    
    { name: 'Mi Billetera', href: '/dashboard/wallet', icon: Wallet, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Identidad KYC', href: '/dashboard/kyc', icon: ShieldCheck, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Seguridad 2FA', href: '/dashboard/security', icon: Lock, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Mi Perfil', href: `/${user.username || 'perfil'}`, icon: User, roles: ['FAN', 'CREATOR', 'ADMIN'] },
  ];

  const allowedLinks = allLinks.filter(link => link.roles.includes(user.role));

  return (
    <>
      {/* 💻 SIDEBAR PARA COMPUTADORAS */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-nm-base border-r border-white/5 z-50 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        
        <div className="p-6 pb-2">
          <Link href="/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]">⚡</span>
            <span className="text-2xl font-black tracking-tighter text-white">FansMio</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-6 overflow-y-auto custom-scrollbar pb-6">
          {allowedLinks.map((link) => {
            // Validación robusta para rutas activas
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/feed' && link.href !== '/explore');
            const Icon = link.icon; 

            return (
              <Link 
                key={link.name} 
                href={link.href}
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

          {/* 👑 BOTÓN MODO DIOS (ADMIN) */}
          {user.role === 'ADMIN' && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 px-4">Panel de Control</p>
              <Link 
                href="/dashboard/admin"
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${
                  pathname.includes('/dashboard/admin') 
                    ? 'nm-inset text-red-500 border border-red-500/20' 
                    : 'nm-btn text-red-500/80 hover:text-red-400'
                }`}
              >
                <Crown className="w-5 h-5" strokeWidth={2.5} />
                <span className="text-sm tracking-wide">Modo Dios</span>
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
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 📱 BOTTOM NAV PARA CELULARES */}
      <nav className="md:hidden fixed bottom-0 w-full bg-nm-base border-t border-white/5 z-50 flex justify-around items-center pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        {/* Mostramos solo los 5 enlaces principales en móvil para no saturar la pantalla */}
        {allowedLinks.slice(0, 5).map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/feed' && link.href !== '/explore');
          const Icon = link.icon;

          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${
                isActive ? 'nm-inset text-teal-500 min-w-[64px] border border-teal-500/20' : 'text-gray-500 hover:text-white nm-btn'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' : ''} transition-all duration-300`} strokeWidth={2.5} />
              {isActive && (
                <span className="text-[9px] font-bold mt-1 tracking-wider">{link.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}