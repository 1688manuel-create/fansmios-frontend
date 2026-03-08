"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import AppLayout from '../../components/AppLayout';

// 🔥 IMPORTAMOS TODOS LOS ICONOS NECESARIOS
import { 
  User, Sparkles, ShieldCheck, ReceiptText, Bell, Settings, ArrowLeft, Mail, 
  Lock, Monitor, Smartphone, LogOut, Crown, Star, Package, Coins, Unlock,
  AlertTriangle, Send, Instagram, Twitter, Globe, Bot, MessageSquare, Loader2,
  MapPin, Ban
} from 'lucide-react';

// 🌍 LISTA DE PAÍSES PARA EL BLOQUEO GEOGRÁFICO
const POPULAR_COUNTRIES = [
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'CR', name: 'Ecuador', flag: '🇨🇷' }, // Costa Rica
];

export default function GlobalSettings() {
  const router = useRouter();
  
  // UX States Globales
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'SECURITY' | 'BILLING' | 'CREATOR' | 'NOTIFICATIONS'>('ACCOUNT');
  const [isLoading, setIsLoading] = useState(true);

  // UX States Cuenta
  const [email, setEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // UX States Seguridad 
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // UX States Notificaciones
  const [emailPromotions, setEmailPromotions] = useState(true);
  const [emailNewMessages, setEmailNewMessages] = useState(true);
  const [emailSales, setEmailSales] = useState(true);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  // UX States Creador
  const [instagramLink, setInstagramLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]); // 🌍 Estado para los países bloqueados
  
  const [isUpdatingSocials, setIsUpdatingSocials] = useState(false);
  const [isUpdatingWelcome, setIsUpdatingWelcome] = useState(false);
  const [isUpdatingGeo, setIsUpdatingGeo] = useState(false);

  // Sesiones Simuladas
  const [sessions, setSessions] = useState([
    { id: 1, device: 'MacBook Pro - Chrome', location: 'Tijuana, MX', time: 'Activo ahora', current: true },
    { id: 2, device: 'iPhone 14 - Safari', location: 'Tijuana, MX', time: 'Hace 2 horas', current: false },
  ]);

  // UX States Facturación
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEmail(parsedUser.email || ''); 
      
      if (parsedUser.emailPromotions !== undefined) setEmailPromotions(parsedUser.emailPromotions);
      if (parsedUser.emailNewMessages !== undefined) setEmailNewMessages(parsedUser.emailNewMessages);
      if (parsedUser.emailSales !== undefined) setEmailSales(parsedUser.emailSales);

      fetchBillingHistory();
      
      if (parsedUser.role === 'CREATOR') {
        fetchCreatorProfile();
      } else {
        setIsLoading(false);
      }
    } else {
      router.push('/auth');
    }
  }, [router]);

  const fetchCreatorProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      if (res.data.user && res.data.user.creatorProfile) {
         setInstagramLink(res.data.user.creatorProfile.instagram || '');
         setTwitterLink(res.data.user.creatorProfile.twitter || '');
         setWebsiteLink(res.data.user.creatorProfile.website || '');
         setWelcomeMessage(res.data.user.creatorProfile.welcomeMessage || '');
         
         // 🌍 Cargamos los países bloqueados de la BD
         const blocked = res.data.user.creatorProfile.blockedCountries;
         if (blocked) {
           setBlockedCountries(blocked.split(',').map((c: string) => c.trim()));
         }
      }
    } catch (error) {
      console.error("Error al cargar perfil del creador");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const res = await api.get('/settings/billing');
      setBillingHistory(res.data.transactions || []);
    } catch (error) {}
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("El correo no puede estar vacío");
    setIsUpdatingEmail(true);
    try {
      const res = await api.put('/settings/user', { email });
      alert(res.data.message);
      const updatedUser = { ...user, email: res.data.user.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al actualizar el correo.");
    } finally { setIsUpdatingEmail(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return alert("Llena ambos campos");
    if (newPassword.length < 6) return alert("La nueva contraseña debe tener al menos 6 caracteres");
    setIsUpdatingPassword(true);
    try {
      const res = await api.put('/settings/password', { currentPassword, newPassword });
      alert(res.data.message);
      setCurrentPassword(''); setNewPassword('');
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al actualizar contraseña");
    } finally { setIsUpdatingPassword(false); }
  };

  const handleSaveNotifications = async () => {
    setIsUpdatingNotifications(true);
    try {
      const res = await api.put('/settings/user', { 
        emailNotifications: emailPromotions, 
        pushNotifications: emailNewMessages 
      });
      alert(res.data.message);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al guardar preferencias");
    } finally { setIsUpdatingNotifications(false); }
  };

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSocials(true);
    try {
      await api.put('/profile/me', { instagram: instagramLink, twitter: twitterLink, website: websiteLink });
      alert("✅ Redes sociales actualizadas correctamente.");
    } catch (error: any) { 
      alert(error.response?.data?.error || "Error al guardar redes."); 
    } finally { setIsUpdatingSocials(false); }
  };

  const handleSaveWelcomeMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingWelcome(true);
    try {
      const res = await api.put('/settings/creator', { welcomeMessage });
      alert(res.data.message);
    } catch (error: any) { 
      alert(error.response?.data?.error || "Error al guardar"); 
    } finally { setIsUpdatingWelcome(false); }
  };

  // 🌍 NUEVA FUNCIÓN: Guardar Geo-Bloqueo
  const handleSaveGeoBlocking = async () => {
    setIsUpdatingGeo(true);
    try {
      const blockedString = blockedCountries.join(',');
      const res = await api.put('/settings/creator', { blockedCountries: blockedString });
      alert("🌍 ¡Fronteras actualizadas! Los países seleccionados ya no pueden ver tu perfil.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al guardar el bloqueo geográfico.");
    } finally {
      setIsUpdatingGeo(false);
    }
  };

  const toggleCountry = (code: string) => {
    if (blockedCountries.includes(code)) {
      setBlockedCountries(blockedCountries.filter(c => c !== code));
    } else {
      setBlockedCountries([...blockedCountries, code]);
    }
  };

  const handleToggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled);
    if (!is2FAEnabled) alert("Modal de código QR para Google Authenticator se abriría aquí.");
  };

  const handleRevokeSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
    alert("Sesión cerrada remotamente con éxito.");
  };

  const handleGlobalLogout = async () => {
    if(!confirm('¿Estás seguro de cerrar sesión en TODOS tus dispositivos?')) return;
    setIsLoggingOut(true);
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/auth');
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    router.push('/auth');
  };

  const NeumorphicToggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <div onClick={onClick} className={`w-14 h-8 nm-inset rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 border ${active ? 'border-red-500/30 bg-[#0e0e0e]' : 'border-transparent bg-[#0a0a0a]'}`}>
      <div className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${active ? 'translate-x-6 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'translate-x-0 bg-gray-500'}`}></div>
    </div>
  );

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" strokeWidth={2.5}/> Ajustes Globales
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors flex items-center gap-2 font-bold">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
          </button>
        </nav>

        <main className="max-w-4xl mx-auto mt-8 px-4 space-y-8 relative z-10">
          
          {/* PESTAÑAS NAVEGADORAS */}
          <div className="flex p-1.5 nm-inset rounded-2xl w-fit overflow-x-auto max-w-full custom-scrollbar border border-white/5 mx-auto lg:mx-0">
            <button onClick={() => setActiveTab('ACCOUNT')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === 'ACCOUNT' ? 'nm-btn-active bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><User className="w-4 h-4"/> Cuenta</button>
            {user?.role === 'CREATOR' && (
              <button onClick={() => setActiveTab('CREATOR')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === 'CREATOR' ? 'nm-btn-active bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Crown className="w-4 h-4"/> Creador</button>
            )}
            <button onClick={() => setActiveTab('SECURITY')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === 'SECURITY' ? 'nm-btn-active bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><ShieldCheck className="w-4 h-4"/> Seguridad</button>
            <button onClick={() => setActiveTab('BILLING')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === 'BILLING' ? 'nm-btn-active bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><ReceiptText className="w-4 h-4"/> Facturación</button>
            <button onClick={() => setActiveTab('NOTIFICATIONS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === 'NOTIFICATIONS' ? 'nm-btn-active bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Bell className="w-4 h-4"/> Avisos</button>
          </div>

          {/* =========================================
              PESTAÑA: CUENTA 
          ========================================= */}
          {activeTab === 'ACCOUNT' && (
            <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 animate-fade-in space-y-8">
              <div>
                <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-red-500"/> Tu Correo Electrónico</h2>
                <p className="text-sm text-gray-400 mb-5 font-medium">Usa este correo para iniciar sesión y recuperar tu contraseña.</p>
                <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Mail className="w-4 h-4"/></span>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full nm-inset border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-red-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                  <button disabled={isUpdatingEmail || email === user.email} className="nm-btn-primary px-8 py-3 rounded-xl disabled:opacity-50 whitespace-nowrap font-bold text-sm">
                    {isUpdatingEmail ? 'Guardando...' : 'Actualizar Email'}
                  </button>
                </form>
              </div>

              <div className="border-t border-white/5 pt-8 space-y-5">
                <h2 className="text-xl font-black text-white flex items-center gap-2"><User className="w-5 h-5 text-gray-400"/> Detalles Públicos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block pl-1">Nombre de Usuario</label>
                    <div className="nm-inset border border-white/5 px-4 py-3 rounded-xl text-white font-bold flex items-center gap-2">
                      <span className="text-red-500">@</span> {user?.username || 'Sin configurar'}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 pl-1">*(No se puede cambiar por seguridad).</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block pl-1">Tipo de Cuenta</label>
                    <div className="nm-inset border border-white/5 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                      {user?.role === 'ADMIN' ? <><Crown className="w-4 h-4 text-red-500"/> <span className="text-red-400">Administrador</span></> : user?.role === 'CREATOR' ? <><Crown className="w-4 h-4 text-yellow-500"/> <span className="text-yellow-400">Creador VIP</span></> : <><Star className="w-4 h-4 text-blue-400"/> <span className="text-blue-300">Fan</span></>}
                    </div>
                  </div>
                </div>
              </div>
              {user?.role !== 'CREATOR' && user?.role !== 'ADMIN' && (
                 <div className="pt-4">
                   <button onClick={() => router.push('/dashboard/profile')} className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center gap-2 nm-btn px-4 py-2 rounded-full border border-red-500/20">
                     <Sparkles className="w-4 h-4"/> Quiero convertirme en Creador
                   </button>
                 </div>
              )}
            </div>
          )}

          {/* =========================================
              PESTAÑA: CREADOR (Redes + Robot + GEO-BLOCKING 🌍)
          ========================================= */}
          {activeTab === 'CREATOR' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0e0e0e] border border-white/5 p-6 rounded-[2rem] gap-4 shadow-lg">
                 <div>
                    <h3 className="text-white font-black flex items-center gap-2 text-lg"><Crown className="w-5 h-5 text-yellow-500"/> Personalizar Mi Negocio</h3>
                    <p className="text-gray-400 text-sm mt-1">Sube fotos, cambia precios y edita tu bio.</p>
                 </div>
                 <button onClick={() => router.push('/dashboard/profile')} className="nm-btn-primary px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                   Ir al Perfil <ArrowLeft className="w-4 h-4 rotate-180" />
                 </button>
              </div>

              {/* 🌍 ESCUDO DE FRONTERA (GEO-BLOCKING) */}
              <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-red-500/20">
                <div className="flex items-start gap-4 mb-6">
                  <Ban className="w-6 h-6 text-red-500 mt-1 shrink-0" />
                  <div>
                    <h2 className="text-xl font-black text-white">Privacidad y Fronteras</h2>
                    <p className="text-sm text-gray-400 mt-1">Selecciona los países donde <strong className="text-red-400">NO</strong> quieres que tu perfil sea visible. (Bloqueo por IP).</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {POPULAR_COUNTRIES.map((country) => {
                    const isBlocked = blockedCountries.includes(country.code);
                    return (
                      <button
                        key={country.code}
                        onClick={() => toggleCountry(country.code)}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border ${
                          isBlocked 
                            ? 'nm-inset border-red-500/50 bg-red-900/10' 
                            : 'nm-btn border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <span className={`text-xs font-bold ${isBlocked ? 'text-red-400' : 'text-gray-400'}`}>
                          {country.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button 
                    onClick={handleSaveGeoBlocking} 
                    disabled={isUpdatingGeo} 
                    className="nm-btn border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white font-black py-3 px-8 rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {isUpdatingGeo ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MapPin className="w-4 h-4" /> Guardar Fronteras</>}
                  </button>
                </div>
              </div>

              {/* 🤖 EL RECEPCIONISTA ROBÓTICO */}
              <div className="nm-btn p-6 sm:p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-start gap-4 mb-6">
                  <Bot className="w-6 h-6 text-teal-500 mt-1 shrink-0" />
                  <div>
                    <h2 className="text-xl font-black text-white">Mensaje de Bienvenida</h2>
                    <p className="text-sm text-gray-400 mt-1">Se enviará por chat a cualquier fan nuevo que compre tu suscripción.</p>
                  </div>
                </div>
                <form onSubmit={handleSaveWelcomeMessage}>
                  <textarea 
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Ej: ¡Hola! Muchas gracias por suscribirte a mi VIP. 💖 Aquí te dejo un regalito..."
                    className="w-full h-32 bg-black/40 nm-inset rounded-2xl p-5 text-white outline-none focus:border-teal-500/50 resize-none text-sm custom-scrollbar mb-4 placeholder:text-gray-600"
                  />
                  <div className="flex justify-end">
                    <button type="submit" disabled={isUpdatingWelcome} className="bg-teal-600 hover:bg-teal-500 text-black font-black py-3 px-8 rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all">
                      {isUpdatingWelcome ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageSquare className="w-4 h-4" /> Guardar Mensaje</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* REDES SOCIALES */}
              <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5">
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2"><Globe className="w-5 h-5 text-blue-500"/> Redes Sociales</h2>
                <p className="text-gray-400 text-sm mb-6 font-medium">Atrae a más fans conectando tu perfil con tus otras redes.</p>

                <form onSubmit={handleSaveSocials} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-500"/> Instagram</label>
                    <input type="url" value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} placeholder="https://instagram.com/tu_usuario" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500/50 transition-colors text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 flex items-center gap-1"><Twitter className="w-3 h-3 text-gray-300"/> Twitter / X</label>
                    <input type="url" value={twitterLink} onChange={(e) => setTwitterLink(e.target.value)} placeholder="https://twitter.com/tu_usuario" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-gray-500/50 transition-colors text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-1 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400"/> Sitio Web</label>
                    <input type="url" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} placeholder="https://mislinks.com" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors text-sm" />
                  </div>
                  <button type="submit" disabled={isUpdatingSocials} className="w-full nm-btn border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-bold text-sm transition-colors mt-2">
                    {isUpdatingSocials ? 'Guardando Redes...' : 'Guardar Redes Sociales'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* =========================================
              PESTAÑA: SEGURIDAD
          ========================================= */}
          {activeTab === 'SECURITY' && (
            <div className="animate-fade-in space-y-6">
              <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <h3 className="text-white font-black text-xl mb-4 border-b border-white/5 pb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-gray-400"/> Cambiar Contraseña</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Contraseña actual" className="flex-1 nm-inset border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Nueva contraseña (mínimo 6)" className="flex-1 nm-inset border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 text-sm" />
                  </div>
                  <button type="submit" disabled={isUpdatingPassword || !currentPassword || !newPassword} className="nm-btn-primary px-8 py-3 rounded-xl disabled:opacity-50 text-sm">
                    {isUpdatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </form>
              </div>

              <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 flex justify-between items-center gap-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500"/> Autenticación en 2 Pasos</h2>
                  <p className="text-sm text-gray-400 mt-1 font-medium">Protege tu cuenta y tus ganancias con una capa extra de seguridad.</p>
                </div>
                <NeumorphicToggle active={is2FAEnabled} onClick={handleToggle2FA} />
              </div>

              <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2"><Monitor className="w-5 h-5 text-gray-400"/> Dispositivos Activos</h2>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Revisa dónde has iniciado sesión últimamente.</p>
                  </div>
                  <button onClick={handleGlobalLogout} disabled={isLoggingOut} className="text-red-400 nm-btn border border-red-500/20 hover:text-white hover:bg-red-600 font-bold py-2.5 px-5 rounded-xl transition-all whitespace-nowrap text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4"/> Cerrar todas las sesiones
                  </button>
                </div>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl nm-btn border border-white/5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl nm-inset flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                          {session.device.includes('Mac') || session.device.includes('PC') ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                            {session.device}
                            {session.current && <span className="text-green-400 text-[9px] px-2 py-0.5 rounded-md nm-inset border border-green-500/20 uppercase tracking-widest font-bold">Actual</span>}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">{session.location} • {session.time}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <button onClick={() => handleRevokeSession(session.id)} className="text-gray-400 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest border-t border-white/5 sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0 flex items-center gap-1 sm:justify-end">
                          <LogOut className="w-3 h-3"/> Desconectar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleLogout} className="w-full nm-btn border border-red-500/20 hover:bg-red-600 hover:text-white text-red-500 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
                  <LogOut className="w-4 h-4"/> Cerrar Sesión (Solo en este equipo)
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              PESTAÑA: FACTURACIÓN 
          ========================================= */}
          {activeTab === 'BILLING' && (
            <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 animate-fade-in">
              <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2"><ReceiptText className="w-5 h-5 text-gray-400"/> Historial de Compras</h2>
              <p className="text-gray-400 mb-8 text-sm font-medium">Registro detallado de todos los pagos que has realizado en la plataforma.</p>
              
              {billingHistory.length === 0 ? (
                <div className="text-center py-16 nm-inset rounded-3xl border border-white/5 max-w-lg mx-auto">
                  <ReceiptText className="w-12 h-12 text-gray-600 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-gray-400 font-medium">Aún no has realizado ninguna compra.</p>
                  <button onClick={() => router.push('/explore')} className="mt-6 nm-btn px-6 py-2.5 rounded-full text-sm font-bold text-gray-300 hover:text-white">Explorar Contenido</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((tx: any) => (
                    <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl nm-btn border border-white/5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl nm-inset flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                          {tx.type === 'SUBSCRIPTION' ? <Star className="w-5 h-5 text-pink-500"/> : tx.type === 'BUNDLE' ? <Package className="w-5 h-5 text-purple-500"/> : tx.type === 'TIP' ? <Coins className="w-5 h-5 text-yellow-500"/> : <Unlock className="w-5 h-5 text-blue-500"/>}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">
                            {tx.type === 'SUBSCRIPTION' ? 'Suscripción Mensual' : tx.type === 'BUNDLE' ? 'Paquete Especial' : tx.type === 'TIP' ? 'Propina' : 'Desbloqueo PPV'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">A favor de: <span className="text-gray-300 font-bold">@{tx.receiver?.username || 'Creador'}</span></p>
                        </div>
                      </div>
                      <div className="sm:text-right flex justify-between sm:block border-t border-white/5 sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        <p className="text-gray-500 text-[10px] sm:mb-1.5 uppercase tracking-wider font-bold">{new Date(tx.createdAt).toLocaleString()}</p>
                        <p className="text-white font-black nm-inset px-3 py-1.5 rounded-lg inline-block border border-white/5 text-sm">${tx.amount?.toFixed(2)} USD</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================
              PESTAÑA: NOTIFICACIONES
          ========================================= */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="nm-inset p-6 sm:p-8 rounded-[2rem] border border-white/5 animate-fade-in space-y-8">
              <div>
                <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2"><Bell className="w-5 h-5 text-gray-400"/> Centro de Notificaciones</h2>
                <p className="text-sm text-gray-400 mb-8 font-medium">Elige qué avisos quieres recibir en tu correo o dispositivo.</p>

                <div className="space-y-4">
                  <div className="nm-btn p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold text-sm">Correos de Novedades</h4>
                      <p className="text-xs text-gray-500 mt-1">Recibe correos cuando haya descuentos o nuevas funciones.</p>
                    </div>
                    <NeumorphicToggle active={emailPromotions} onClick={() => setEmailPromotions(!emailPromotions)} />
                  </div>

                  <div className="nm-btn p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold text-sm">Nuevos Mensajes (Chat)</h4>
                      <p className="text-xs text-gray-500 mt-1">Aviso por correo cuando recibas un mensaje privado nuevo.</p>
                    </div>
                    <NeumorphicToggle active={emailNewMessages} onClick={() => setEmailNewMessages(!emailNewMessages)} />
                  </div>

                  {user?.role === 'CREATOR' && (
                    <div className="nm-btn border-l-2 border-l-green-500 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-green-400 font-bold flex items-center gap-2 text-sm"><Coins className="w-4 h-4"/> Alertas de Ventas y Propinas</h4>
                        <p className="text-xs text-gray-500 mt-1">¡El sonido del dinero! Avisos instantáneos por cada ganancia.</p>
                      </div>
                      <NeumorphicToggle active={emailSales} onClick={() => setEmailSales(!emailSales)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-8">
                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest pl-1">Alertas Push (Móvil/Web)</h3>
                <div className="nm-inset p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold text-sm flex items-center gap-2"><Send className="w-4 h-4 text-blue-400"/> Notificaciones en tiempo real</h4>
                    <p className="text-xs text-gray-500 mt-1">Recibe burbujas de notificación en tu pantalla aunque no tengas la app abierta.</p>
                  </div>
                  <button 
                    onClick={() => {
                      alert("🔔 Revisa la parte superior de tu navegador para conceder los permisos.");
                    }}
                    className="nm-btn border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm whitespace-nowrap shrink-0"
                  >
                    Activar Push
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-white/5">
                <button onClick={handleSaveNotifications} disabled={isUpdatingNotifications} className="nm-btn-primary px-8 py-3 rounded-xl disabled:opacity-50 text-sm">
                  {isUpdatingNotifications ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </AppLayout>
  );
}