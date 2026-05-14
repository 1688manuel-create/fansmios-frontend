"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../lib/authService';
import Link from 'next/link';
import { useTranslations } from 'next-intl'; 
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'; 

export default function Login() {
  const router = useRouter();
  const t = useTranslations('Login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  
  const [requires2FA, setRequires2FA] = useState(false); 
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null); 

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================
  // PASO 1: VALIDAR CORREO Y CONTRASEÑA
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      
      if (response?.requires2FA) {
        setRequires2FA(true);
        setTempUserId(response.userId); 
        setLoading(false);
        return; 
      }

      // 🔥 AQUÍ ESTÁ LA MAGIA QUE ROMPE EL BUCLE
      window.location.href = '/feed'; 
    } catch (err: any) {
      setError(err.response?.data?.error || t('alert_error'));
      setLoading(false);
    } 
  };

  // ==========================================
  // PASO 2: VALIDAR TOKEN 2FA (Si lo requiere)
  // ==========================================
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorToken.length !== 6) return;
    
    setError('');
    setLoading(true);

    try {
      await authService.verify2FALogin({ userId: tempUserId, token: twoFactorToken });
      
      // 🔥 AQUÍ TAMBIÉN ROMPEMOS EL BUCLE
      window.location.href = '/feed'; 
    } catch (err: any) {
      setError(err.response?.data?.error || t('alert_error_2fa'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[500px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-8 relative z-10 border border-white/5 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <span className="text-2xl drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]">⚡</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {requires2FA ? t('title_2fa') : t('title')}
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            {requires2FA ? t('subtitle_2fa') : t('subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center font-bold animate-fade-in">
            {error}
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">{t('lbl_email')}</label>
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">{t('lbl_password')}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium text-sm tracking-widest"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !email || !password}
              className="w-full py-4 px-6 rounded-xl bg-white text-black font-black text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> {t('btn_verifying')}</> : t('btn_login')}
            </button>
          </form>

        ) : (

          <form onSubmit={handle2FASubmit} className="space-y-6 animate-fade-in">
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lbl_2fa_code')}</label>
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20"><Lock className="w-3 h-3"/> {t('lbl_required')}</span>
              </div>
              <input 
                type="text" 
                maxLength={6} 
                required
                value={twoFactorToken} 
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))} 
                placeholder="••••••" 
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.7em] font-mono font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-800" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || twoFactorToken.length !== 6}
              className="w-full py-4 px-6 rounded-xl bg-purple-500 text-white font-black text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> {t('btn_verifying')}</> : t('btn_verify_2fa')}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setRequires2FA(false); setTwoFactorToken(''); }}
              className="w-full text-center text-xs text-gray-500 font-bold hover:text-white transition-colors"
            >
              {t('btn_cancel_login')}
            </button>
          </form>
        )}

        {!requires2FA && (
          <p className="text-center text-sm text-gray-400 font-medium pt-4 border-t border-white/5">
            {t('lbl_no_account')} <Link href="/?tab=register" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">{t('link_register')}</Link>
          </p>
        )}
      </div>
    </main>
  );
}