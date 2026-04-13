"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../lib/authService';
import Link from 'next/link';
import { useTranslations } from 'next-intl'; // 👈 AGREGAMOS EL TRADUCTOR

export default function Login() {
  const router = useRouter();
  const t = useTranslations('Login'); // 👈 INICIAMOS EL TRADUCTOR
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/feed'); 
    } catch (err: any) {
      setError(err.response?.data?.error || t('alert_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      {/* 🔮 Luz ambiental de fondo para darle el toque premium */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[500px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-8 relative z-10 border border-white/5 shadow-2xl">
        
        <div className="text-center space-y-2">
          {/* Logo Táctico */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 nm-inset bg-black rounded-xl flex items-center justify-center border border-white/5">
              <span className="text-2xl drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]">⚡</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">{t('title')}</h1>
          <p className="text-gray-400 text-sm font-medium">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center font-bold animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_email')}</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-sm"
                placeholder={t('ph_email')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('lbl_password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-sm tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-white text-black font-black text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {loading ? t('btn_verifying') : t('btn_login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 font-medium pt-4 border-t border-white/5">
          {t('lbl_no_account')} <Link href="/?tab=register" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">{t('link_register')}</Link>
        </p>
      </div>
    </main>
  );
}