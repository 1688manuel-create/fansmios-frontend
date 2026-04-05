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
  Menu, // <-- Nuestro nuevo botón táctico móvil
  PlaySquare, 
  X // <-- Para cerrar el menú móvil
} from 'lucide-react';

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 📱 ESTADO DEL CAJÓN MÓVIL
  const pathname = usePathname();
  const router = useRouter();

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

  // 🚪 Cierra el menú móvil si cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/auth');
  };

  if (!user) return null;

  // 🚀 LISTA MAESTRA DE RUTAS (PARA PC)
  const allLinks = [
    { name: 'Feed', href: '/feed', icon: Home, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Explorar', href: '/explore', icon: Compass, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Mensajes', href: '/dashboard/messages', icon: MessageCircle, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Transmitir', href: '/dashboard/live', icon: Radio, roles: ['CREATOR', 'ADMIN'] },
    
    // 🎓 RUTA TÁCTICA: ACADEMIA VIP
    { name: 'Academia VIP', href: '/dashboard/series', icon: PlaySquare, roles: ['CREATOR', 'ADMIN'] },
    
    // 🔥 BOTONES FINANCIEROS 
    { name: 'Estadísticas', href: '/dashboard/analytics', icon: TrendingUp, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Cupones', href: '/dashboard/coupons', icon: Ticket, roles: ['CREATOR', 'ADMIN'] }, 
    
    { name: 'Mi Billetera', href: '/dashboard/wallet', icon: Wallet, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Identidad KYC', href: '/dashboard/kyc', icon: ShieldCheck, roles: ['CREATOR', 'ADMIN'] },
    { name: 'Seguridad 2FA', href: '/dashboard/security', icon: Lock, roles: ['FAN', 'CREATOR', 'ADMIN'] },
    { name: 'Mi Perfil', href: `/${user.username || 'perfil'}`, icon: User, roles: ['FAN', 'CREATOR', 'ADMIN'] },
  ];

  const allowedLinks = allLinks.filter(link => link.roles.includes(user.role));

  // 📱 LISTA ESPECÍFICA PARA EL MENÚ INFERIOR DE CELULAR (5 items exactos para no romper UI)
  const mobileLinks = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Explorar', href: '/explore', icon: Compass },
    user.role === 'CREATOR' || user.role === 'ADMIN' 
        ? { name: 'Transmitir', href: '/dashboard/live', icon: Radio, isCenter: true }
        : { name: 'Mensajes', href: '/dashboard/messages', icon: MessageCircle, isCenter: true },
    { name: 'Perfil', href: `/${user.username || 'perfil'}`, icon: User },
    { name: 'Menú', href: '#', icon: Menu, isMenuToggle: true } // 👈 EL GATILLO DEL CAJÓN EXTRA
  ];

  // Identificamos cuáles links NO están en la barra principal del celular para ponerlos en el cajón
  const bottomNavHrefs = mobileLinks.map(l => l.href);
  const extraMobileLinks = allowedLinks.filter(link => !bottomNavHrefs.includes(link.href) && link.href !== '#');

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

          {/* 👑 SECCIÓN MODO DIOS (ADMIN) */}
          {user.role === 'ADMIN' && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 px-4">Centro de Mando</p>
              
              <Link href="/dashboard/admin" className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${pathname === '/dashboard/admin' ? 'nm-inset text-red-500' : 'nm-btn text-red-500/80 hover:text-red-400'}`}>
                <Crown className="w-5 h-5" />
                <span className="text-sm">Modo Dios</span>
              </Link>

              <Link href="/admin/payouts" className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${pathname === '/admin/payouts' ? 'nm-inset text-orange-500' : 'nm-btn text-orange-500/80 hover:text-orange-400'}`}>
                <Wallet className="w-5 h-5" />
                <span className="text-sm">Pagos Pendientes</span>
              </Link>

              <Link href="/admin/settings" className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${pathname === '/admin/settings' ? 'nm-inset text-purple-500' : 'nm-btn text-purple-500/80 hover:text-purple-400'}`}>
                <Settings className="w-5 h-5" />
                <span className="text-sm">Configuración</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 bg-nm-base/80 backdrop-blur-md border-t border-white/5 pb-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 nm-btn font-bold text-gray-500 hover:text-red-500 transition-all group">
            <LogOut className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all" strokeWidth={2.5} />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 📱 CAJÓN DESPLEGABLE DE CRISTAL (Extra Menú Móvil) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z- bg-black/80 backdrop-blur-sm flex flex-col justify-end pb-[88px] animate-fade-in">
          <div className="bg-[#0e0e0e] border-t border-white/10 rounded-t-[2rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-slide-up">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black text-lg">Más Opciones</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 nm-btn rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {extraMobileLinks.map(link => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-all ${
                      isActive ? 'nm-inset text-teal-500 shadow-[inset_0_0_10px_rgba(20,184,166,0.1)] border border-teal-500/20' : 'bg-black/20 text-gray-400 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{link.name}</span>
                  </Link>
                );
              })}

              <button onClick={handleLogout} className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 BOTTOM NAV PARA CELULARES (REDISEÑO GLASSMORPHISM) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 pointer-events-none">
        
        {/* El Bloque de Cristal */}
        <div className="bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex justify-around items-center px-2 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto relative z-50">
          
          {mobileLinks.map((link: any, index: number) => {
            const isActive = pathname === link.href && !link.isMenuToggle;
            const Icon = link.icon;

            // ⚡ Si es el botón de "Menú", le damos comportamiento de gatillo
            if (link.isMenuToggle) {
              return (
                <button 
                  key="mobile-menu-trigger"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative flex flex-col items-center justify-center w-14 h-12 transition-all group"
                >
                  <Icon className={`w-6 h-6 transition-all duration-300 ${isMobileMenuOpen ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] scale-110' : 'text-gray-500'}`} strokeWidth={isMobileMenuOpen ? 3 : 2.5} />
                </button>
              );
            }

            return (
              <Link 
                key={`${link.name}-${index}`} 
                href={link.href}
                className="relative flex flex-col items-center justify-center w-14 h-12 transition-all group"
              >
                {/* Si es el botón central, lo hacemos destacar (estilo TikTok/IG) */}
                {link.isCenter ? (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isActive ? 'bg-gradient-to-tr from-teal-500 to-blue-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-white/10 border border-white/20'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-300'}`} strokeWidth={isActive ? 3 : 2} />
                  </div>
                ) : (
                  <>
                    <Icon 
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive 
                          ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] scale-110' 
                          : 'text-gray-500 group-hover:text-gray-300'
                      }`} 
                      strokeWidth={isActive ? 3 : 2.5} 
                    />
                    {/* Solo mostramos el puntito si está activo (minimalismo puro) */}
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