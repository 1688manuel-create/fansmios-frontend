"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import AppLayout from '../../../components/AppLayout';

// 🔥 IMPORTAMOS ICONOS PREMIUM DE LUCIDE
import { 
  Settings, 
  ArrowLeft, 
  Camera, 
  User, 
  Globe, 
  DollarSign, 
  ShieldAlert, 
  AlertTriangle,
  Save,
  EyeOff,
  Image as ImageIcon,
  Instagram,
  Twitter
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// 🛡️ FUNCION EXTRACTORA DE URLS LIMPIA
const getImageUrl = (path: string | null) => {
  if (!path) return '';
  const cleanPath = path.trim(); 
  
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${finalPath}`;
};

const CATEGORIES = ['General', 'Fitness', 'Gaming', 'Música', 'Arte', 'Lifestyle', 'Educación', 'Adulto'];

export default function ProfileSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('General');
  const [monthlyPrice, setMonthlyPrice] = useState('0');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // 🚀 ESTADOS DE REDES SOCIALES
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  
  // Estados de privacidad
  const [hideStats, setHideStats] = useState(false);
  const [blockedCountries, setBlockedCountries] = useState('');

  // Estados para imágenes
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Archivos reales para subir
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/users/profile'); 
      const userData = res.data.user || res.data;

      setUsername(userData.username || '');
      setName(userData.name || '');
      setBio(userData.creatorProfile?.bio || '');
      setCategory(userData.creatorProfile?.category || 'General');
      setMonthlyPrice(userData.creatorProfile?.monthlyPrice?.toString() || '0');
      setWelcomeMessage(userData.creatorProfile?.welcomeMessage || '');
      
      // 🔥 Cargamos las redes sociales desde la base de datos
      setInstagram(userData.creatorProfile?.instagram || '');
      setTwitter(userData.creatorProfile?.twitter || '');
      setWebsite(userData.creatorProfile?.website || '');
      
      setHideStats(userData.creatorProfile?.hideStats || false);
      setBlockedCountries(userData.creatorProfile?.blockedCountries || '');

      // 🛡️ FIX 1: USAMOS GETIMAGEURL PARA EVITAR URLS MUTANTES
      if (userData.creatorProfile?.profileImage) {
        setProfilePreview(getImageUrl(userData.creatorProfile.profileImage));
      }
      if (userData.creatorProfile?.coverImage) {
        setCoverPreview(getImageUrl(userData.creatorProfile.coverImage));
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    if (e.target.files && e.target.files) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'profile') {
        setProfileFile(file);
        setProfilePreview(previewUrl);
      } else {
        setCoverFile(file);
        setCoverPreview(previewUrl);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("🚀 BOTÓN GUARDAR PRESIONADO");
    console.log("📸 Foto Perfil:", profileFile ? profileFile.name : "Misma / Ninguna");
    console.log("🖼️ Foto Portada:", coverFile ? coverFile.name : "Misma / Ninguna");

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('category', category);
      formData.append('monthlyPrice', monthlyPrice);
      formData.append('welcomeMessage', welcomeMessage);
      
      formData.append('instagram', instagram);
      formData.append('twitter', twitter);
      formData.append('website', website);
      
      formData.append('hideStats', String(hideStats));
      formData.append('blockedCountries', blockedCountries);

      if (profileFile) formData.append('profileImage', profileFile);
      if (coverFile) formData.append('coverImage', coverFile);

      // 🚀 MISIL BYPASS: Ignoramos el 'api' que nos sabotea y usamos 'fetch' nativo.
      // Obtenemos tu token de seguridad directamente (ajusta el nombre si lo guardas distinto)
      const token = localStorage.getItem('token'); 

      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // ⚠️ NUNCA poner 'Content-Type' aquí. El navegador lo pone solo con el Boundary perfecto.
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('El servidor rechazó la petición');
      }

      alert('✅ ¡Perfil actualizado con éxito!');
      
      // Misil anti-caché
      window.location.href = `/${username}`; 
    } catch (error) {
      console.error("🚨 Error guardando:", error);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const NeumorphicToggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <div 
      onClick={onClick} 
      className={`w-14 h-8 nm-inset rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 border ${active ? 'border-purple-500/30 bg-[#0e0e0e]' : 'border-transparent bg-[#0a0a0a]'}`}
    >
      <div className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${active ? 'translate-x-6 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]' : 'translate-x-0 bg-gray-500'}`}>
      </div>
    </div>
  );

  if (isLoading) return <div className="min-h-screen bg-nm-base flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base text-white pb-20 relative">
        
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" strokeWidth={2.5}/> Configurar Perfil
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
          </button>
        </nav>

        <main className="max-w-4xl mx-auto mt-8 px-4 space-y-10 relative z-10">
          
          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in">
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4"/> 1. Identidad Visual
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">La primera impresión es la que cuenta. Sube imágenes de alta calidad.</p>
            </div>
            
            <div className="p-6 md:p-8 bg-[#0a0a0a]">
              <div className="relative rounded-[2rem] overflow-hidden border border-white/10 nm-inset group select-none">
                <div className="h-48 md:h-64 w-full relative">
                  {coverPreview ? (
                    <img 
                      src={coverPreview} 
                      alt="Cover" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-all duration-500 pointer-events-none" 
                      onContextMenu={(e) => e.preventDefault()}
                      draggable="false"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => coverInputRef.current?.click()} className="nm-btn-primary px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] border-transparent bg-black/60 backdrop-blur-md">
                      <Camera className="w-4 h-4" /> Cambiar Portada
                    </button>
                  </div>
                </div>

                <div className="absolute -bottom-10 left-6 md:left-10 z-10">
                  <div 
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0a0a0a] bg-nm-base overflow-hidden shadow-2xl group/avatar cursor-pointer nm-inset select-none" 
                    onClick={() => profileInputRef.current?.click()}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {profilePreview ? (
                      <img 
                        src={profilePreview} 
                        alt="Avatar" 
                        className="w-full h-full object-cover group-hover/avatar:opacity-40 transition-all pointer-events-none" 
                        draggable="false"
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl font-black bg-gradient-to-tr from-blue-600 to-purple-600 w-full h-full flex items-center justify-center text-white">
                        {username ? username.toUpperCase() : 'U'}
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleImageChange(e, 'cover')} className="hidden" />
              <input type="file" accept="image/*" ref={profileInputRef} onChange={(e) => handleImageChange(e, 'profile')} className="hidden" />
            </div>
          </div>

          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4"/> 2. Información Pública
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">Así es como te verán los fans en la página de Explorar.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Nombre a Mostrar</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Pérez" className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-teal-500/50 transition-colors text-sm placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Enlace de tu Perfil (Username)</label>
                  <div className="flex items-center nm-inset border border-white/5 rounded-xl overflow-hidden focus-within:border-teal-500/50 transition-colors">
                    <span className="text-gray-500 pl-4 text-sm font-medium select-none">fansmio.com/</span>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full bg-transparent px-2 py-3.5 text-white font-bold outline-none text-sm transition-colors" 
                      placeholder="nuevo_usuario"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Categoría Principal</label>
                <div className="relative">
                   <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-teal-500/50 transition-colors appearance-none text-sm">
                     {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0e0e0e]">{cat}</option>)}
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     ▼
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Biografía</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntales a tus fans quién eres y qué contenido encontrarán aquí..." rows={4} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500/50 transition-colors resize-none custom-scrollbar text-sm placeholder:text-gray-600 leading-relaxed" />
              </div>

              <div className="pt-6 border-t border-white/5 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-blue-500"/> Tus Redes Sociales Externas</h3>
                <p className="text-xs text-gray-500 mb-6 font-medium">Vincula tus otras cuentas para que tus fans puedan seguirte en todos lados.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1"><Instagram className="w-3 h-3 text-pink-500"/> Instagram</label>
                    <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/usuario" className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-pink-500/50 transition-colors text-sm placeholder:text-gray-600" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1"><Twitter className="w-3 h-3 text-gray-300"/> Twitter / X</label>
                    <input type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/usuario" className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gray-400/50 transition-colors text-sm placeholder:text-gray-600" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400"/> Sitio Web o Linktree</label>
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mislinks.com" className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 transition-colors text-sm placeholder:text-gray-600" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-4 h-4"/> 3. Monetización & Fans
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">Configura cuánto cobrarás por mes y cómo recibirás a tus nuevos VIPs.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 bg-[#0a0a0a]">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Suscripción Mensual (USD)</label>
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">$</span>
                  <input type="number" min="0" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="w-full nm-inset border border-green-500/20 rounded-xl pl-8 pr-4 py-3.5 text-white font-bold outline-none focus:border-green-500/50 transition-colors shadow-inner text-sm" />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 pl-1 font-medium">Tip: Pon $0 para que tu perfil sea gratuito y solo cobrar por PPV en chats o posts.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Mensaje Automático de Bienvenida</label>
                <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Este mensaje se enviará automáticamente por chat a cada fan que se suscriba..." rows={3} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-4 text-white outline-none focus:border-green-500/50 transition-colors resize-none custom-scrollbar text-sm placeholder:text-gray-600 leading-relaxed" />
              </div>
            </div>
          </div>

          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/> 4. Privacidad Avanzada
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">Controla quién puede ver tu perfil y qué información haces pública.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                  <h4 className="text-white font-bold flex items-center gap-2"><EyeOff className="w-4 h-4 text-gray-400"/> Ocultar Estadísticas</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-sm">Si activas esto, nadie podrá ver la cantidad de seguidores o posts que tienes en tu perfil público.</p>
                </div>
                <NeumorphicToggle active={hideStats} onClick={() => setHideStats(!hideStats)} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Bloqueo Geográfico (Países)</label>
                <p className="text-xs text-gray-500 mb-4 pl-1">Escribe las siglas de los países que quieres bloquear, separadas por coma (Ej: MX, US, CO, ES, AR).</p>
                <input 
                  type="text" 
                  value={blockedCountries} 
                  onChange={(e) => setBlockedCountries(e.target.value.toUpperCase())} 
                  placeholder="Ej. MX, US, CO" 
                  className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500/50 transition-colors uppercase text-sm font-bold tracking-widest" 
                />
                <p className="text-[10px] text-yellow-500/80 mt-3 flex items-center gap-1.5 pl-1 font-bold">
                  <AlertTriangle className="w-3 h-3" /> <span className="text-gray-400">Usuarios con IP de estos países verán tu perfil como "No disponible".</span>
                </p>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-4 pb-10">
            <button onClick={handleSave} disabled={isSaving} className="nm-btn-primary px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center gap-3 text-base">
              {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Save className="w-5 h-5" /> Guardar Todos los Cambios</>}
            </button>
          </div>

        </main>
      </div>
    </AppLayout>
  );
}