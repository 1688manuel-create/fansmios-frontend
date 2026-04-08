// frontend/app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Settings, Save, MessageSquare, Users, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function AdminSettings() {
  const router = useRouter();

  const t = useTranslations('AdminSettings'); // 👈 AGREGAR ESTA LÍNEA AQUÍ

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [creatorMessage, setCreatorMessage] = useState("");
  const [fanMessage, setFanMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchSettings();
  }, []);

  // 🔥 CARGA REAL DESDE LA BASE DE DATOS
  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings/welcome');
      setCreatorMessage(res.data.creatorMessage);
      setFanMessage(res.data.fanMessage);
    } catch (error) {
      console.error("Error al cargar configuraciones", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/settings/welcome', { creatorMessage, fanMessage });
      alert(t('alert_success'));
    } catch (error) {
      alert(t('alert_error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-bold tracking-widest animate-pulse">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      {/* 👑 NAVBAR DEL ADMIN */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-purple-500/20 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-black/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight">{t('nav_title')}</h1>
            <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">{t('nav_subtitle')}</p>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-white/5 border border-white/10 text-white px-5 py-2 rounded-full hover:bg-white/10 transition-all font-bold">
          {t('btn_exit')}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto mt-10 px-4">
        {/* BANNER INFORMATIVO */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#0a0a0a] mb-8 flex items-start gap-4">
          <div className="p-3 bg-purple-500/10 rounded-full shrink-0">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg mb-1">{t('banner_title')}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('banner_desc')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* CREADORES */}
          <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-yellow-500/20 bg-black/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500/10 px-4 py-2 rounded-bl-2xl border-b border-l border-yellow-500/20">
              <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Crown className="w-3 h-3" /> {t('badge_creators')}
              </span>
            </div>
            <label className="text-sm font-bold text-white mb-4 block">{t('lbl_msg_creators')}</label>
            <textarea 
              value={creatorMessage}
              onChange={(e) => setCreatorMessage(e.target.value)}
              className="w-full h-48 bg-[#111] border border-white/10 rounded-2xl p-5 text-gray-300 focus:border-yellow-500/50 outline-none resize-none custom-scrollbar"
            />
          </div>

          {/* FANS */}
          <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-blue-500/20 bg-black/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500/10 px-4 py-2 rounded-bl-2xl border-b border-l border-blue-500/20">
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" /> {t('badge_fans')}
              </span>
            </div>
            <label className="text-sm font-bold text-white mb-4 block">{t('lbl_msg_fans')}</label>
            <textarea 
              value={fanMessage}
              onChange={(e) => setFanMessage(e.target.value)}
              className="w-full h-32 bg-[#111] border border-white/10 rounded-2xl p-5 text-gray-300 focus:border-blue-500/50 outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving || !creatorMessage || !fanMessage}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-lg py-4 px-10 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-pulse">{t('btn_saving')}</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('btn_save')}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}