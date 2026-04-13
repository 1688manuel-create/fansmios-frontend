"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// 🔥 FIX 1: Rutas corregidas (quitamos un '../')
import api from '../../../../lib/api';
import AppLayout from '../../../../components/AppLayout';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

// 🔥 IMPORTAMOS ICONOS PREMIUM DE LUCIDE
import { 
  Settings, 
  ArrowLeft, 
  Camera, 
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

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  // 🛡️ Limpiamos espacios invisibles o retornos de carro que rompen la lectura
  const cleanPath = path.trim(); 
  
  // Si ya es un enlace a la nube, lo dejamos pasar intacto
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  // Si es un archivo local
  const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  const cleanBase = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  return `${cleanBase}/${finalPath}`;
};

const CATEGORIES = ['General', 'Fitness', 'Gaming', 'Música', 'Arte', 'Lifestyle', 'Educación', 'Adulto'];

export default function ProfileSettings() {
  const router = useRouter();
  const t = useTranslations('ProfileSettings2'); // 👈 USAMOS UN NUEVO NOMBRE PARA NO CHOCAR
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('General');
  const [monthlyPrice, setMonthlyPrice] = useState('0');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // ESTADOS DE REDES SOCIALES
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
      
      setInstagram(userData.creatorProfile?.instagram || '');
      setTwitter(userData.creatorProfile?.twitter || '');
      setWebsite(userData.creatorProfile?.website || '');
      
      setHideStats(userData.creatorProfile?.hideStats || false);
      setBlockedCountries(userData.creatorProfile?.blockedCountries || '');

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
    // 🔥 FIX 2: Agregamos el para sacar el archivo de la lista correctamente
    if (e.target.files && e.target.files[0]) {
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

      await api.put('/users/profile', formData, );

      alert(t('alert_success_save'));
      
      window.location.href = `/${username}`; 
      
    } catch (error) {
      alert(t('alert_error_save'));
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
        
        {/* NAVBAR SUPERIOR NEUMÓRFICA */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" strokeWidth={2.5}/> {t('nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
          </button>
        </nav>

        <main className="max-w-4xl mx-auto mt-8 px-4 space-y-10 relative z-10">
          
          {/* SECCIÓN 1: IDENTIDAD VISUAL */}
          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in">
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4"/> {t('sec1_title')}
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">{t('sec1_desc')}</p>
            </div>
            
            <div className="p-6 md:p-8 bg-[#0a0a0a]">
              <div className="relative rounded-[2rem] overflow-hidden border border-white/10 nm-inset group select-none">
                {/* Portada */}
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
                      <Camera className="w-4 h-4" /> {t('btn_change_cover')}
                    </button>
                  </div>
                </div>

                {/* Avatar Flotante */}
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
                        {username ? username?.toUpperCase() : 'U'}
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

          {/* SECCIÓN 2: INFORMACIÓN PÚBLICA */}
          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4"/> {t('sec2_title')}
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">{t('sec2_desc')}</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_display_name')}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('ph_display_name')} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-teal-500/50 transition-colors text-sm placeholder:text-gray-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_username')}</label>
                  <div className="flex items-center nm-inset border border-white/5 rounded-xl overflow-hidden focus-within:border-teal-500/50 transition-colors">
                    <span className="text-gray-500 pl-4 text-sm font-medium">fansmio.com/</span>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
                      className="w-full bg-transparent px-2 py-3.5 text-white font-bold outline-none text-sm transition-colors" 
                      placeholder="usuario"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_category')}</label>
                <div className="relative">
                   <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-teal-500/50 transition-colors appearance-none text-sm">
                     {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0e0e0e]">{t(`cat_${cat.toLowerCase()}`) || cat}</option>)}
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                     ▼
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_bio')}</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('ph_bio')} rows={4} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500/50 transition-colors resize-none custom-scrollbar text-sm placeholder:text-gray-600 leading-relaxed" />
              </div>

              {/* FORMULARIO DE REDES SOCIALES */}
              <div className="pt-6 border-t border-white/5 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-blue-500"/> {t('lbl_social_links')}</h3>
                <p className="text-xs text-gray-500 mb-6 font-medium">{t('desc_social_links')}</p>
                
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
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400"/> {t('lbl_website')}</label>
                    <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mislinks.com" className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 transition-colors text-sm placeholder:text-gray-600" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN 3: MONETIZACIÓN */}
          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-4 h-4"/> {t('sec3_title')}
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">{t('sec3_desc')}</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 bg-[#0a0a0a]">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_subscription_price')}</label>
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">$</span>
                  <input type="number" min="0" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="w-full nm-inset border border-green-500/20 rounded-xl pl-8 pr-4 py-3.5 text-white font-bold outline-none focus:border-green-500/50 transition-colors shadow-inner text-sm" />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 pl-1 font-medium">{t('desc_subscription_price')}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_welcome_msg')}</label>
                <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder={t('ph_welcome_msg')} rows={3} className="w-full nm-inset border border-white/5 rounded-xl px-4 py-4 text-white outline-none focus:border-green-500/50 transition-colors resize-none custom-scrollbar text-sm placeholder:text-gray-600 leading-relaxed" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: PRIVACIDAD */}
          <div className="nm-inset rounded-[2rem] border border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 border-b border-white/5 bg-[#0e0e0e]">
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/> {t('sec4_title')}
              </h2>
              <p className="text-xs text-gray-500 mt-2 font-medium">{t('sec4_desc')}</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 bg-[#0a0a0a]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                  <h4 className="text-white font-bold flex items-center gap-2"><EyeOff className="w-4 h-4 text-gray-400"/> {t('lbl_hide_stats')}</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-sm">{t('desc_hide_stats')}</p>
                </div>
                <NeumorphicToggle active={hideStats} onClick={() => setHideStats(!hideStats)} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_geo_block')}</label>
                <p className="text-xs text-gray-500 mb-4 pl-1">{t('desc_geo_block')}</p>
                <input 
                  type="text" 
                  value={blockedCountries} 
                  onChange={(e) => setBlockedCountries(e.target.value.toUpperCase())} 
                  placeholder="Ej. MX, US, CO" 
                  className="w-full nm-inset border border-white/5 rounded-xl px-4 py-3.5 text-white outline-none focus:border-purple-500/50 transition-colors uppercase text-sm font-bold tracking-widest" 
                />
                <p className="text-[10px] text-yellow-500/80 mt-3 flex items-center gap-1.5 pl-1 font-bold">
                  <AlertTriangle className="w-3 h-3" /> <span className="text-gray-400">{t('warning_geo_block')}</span>
                </p>
              </div>

            </div>
          </div>

          {/* BOTÓN FLOTANTE GUARDAR */}
          <div className="flex justify-end pt-4 pb-10">
            <button onClick={handleSave} disabled={isSaving} className="nm-btn-primary px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center gap-3 text-base">
              {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><Save className="w-5 h-5" /> {t('btn_save_all')}</>}
            </button>
          </div>

        </main>
      </div>
    </AppLayout>
  );
}