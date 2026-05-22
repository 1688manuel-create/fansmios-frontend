"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ShieldCheck, Lock, CheckCircle2, Loader2, Mail, Gift } from "lucide-react";
import { useTranslations } from 'next-intl'; // 🔥 INVOCAMOS AL TRADUCTOR

export default function Home() {
  const router = useRouter();
  const t = useTranslations('Home'); // 🔥 INVOCAMOS AL TRADUCTOR

  // UX States
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // NUEVOS ESTADOS PARA REENVIAR CORREO
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'FAN' | 'CREATOR'>('FAN');
  
  // 🔥 NUEVO: Estado para confirmar mayoría de edad (Obligatorio en registro)
  const [isAdult, setIsAdult] = useState(false);

  // ESTADO DEL RADAR DE REFERIDOS
  const [referralCode, setReferralCode] = useState('');

  // RADAR DE ENLACES: Atrapa el código de la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const tab = params.get('tab');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false); // Si trae código, lo pasamos directo a Registrarse
    } else if (tab === 'register') {
      setIsLogin(false);
    }
  }, []);

  // 🔥 ACTUALIZADO: isAdult debe ser true si es registro para que el botón se encienda
  const isFormValid = isLogin 
    ? email.includes('@') && password.length >= 6 
    : email.includes('@') && password.length >= 6 && username.length >= 3 && isAdult;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResendSuccess('');
    setUnverifiedEmail('');

    try {
      if (isLogin) {
        // LÓGICA DE LOGIN
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // 🔥 REDIRECCIÓN INTELIGENTE CORREGIDA (TODOS AL FEED)
        if (res.data.user.role === 'CREATOR') {
            // El Creador necesita KYC aprobado para operar. Si no, a la bóveda.
            if (res.data.user.creatorProfile?.kycStatus !== 'APPROVED') {
                router.push('/dashboard/kyc');
            } else {
                // Creador verificado = Pase directo al Feed
                router.push('/feed');
            }
        } else {
            // El FAN (o ADMIN) tiene pase libre directo al Feed
            router.push('/feed');
        }
        
      } else {
        // LÓGICA DE REGISTRO
        await api.post('/auth/register', { 
          username, 
          email, 
          password, 
          role,
          referralCode: referralCode || undefined
        });
        
        setIsLogin(true);
        alert(t('alert_created')); // 🔥 ALERTA MULTI-IDIOMA
        setPassword('');
        setIsAdult(false); // Reiniciamos el checkbox tras un registro exitoso
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.error || t('error_connection'));
      
      // SI EL BACKEND DICE QUE FALTA VERIFICAR CORREO, GUARDAMOS EL EMAIL
      if (errorData?.needsVerification && errorData?.email) {
        setUnverifiedEmail(errorData.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // FUNCIÓN PARA REENVIAR EL CORREO
  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResendSuccess(res.data.message || t('alert_email_resent'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('error_email_resend'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden text-white selection:bg-red-500/30">
      
      {/* 🔴 LUZ DE AMBIENTE DE FONDO */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full animate-fade-in mt-10 mb-20">
        
        {/* LOGO Y HERO SECTION */}
        <div className="flex flex-col items-center mb-10 w-full max-w-lg mx-auto">
          <div className="w-20 h-20 nm-inset bg-black rounded-3xl flex items-center justify-center border border-white/5 shadow-[0_0_40px_rgba(239,68,68,0.2)] mb-6">
            <span className="text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">⚡</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-center">
            FANSMIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700"></span>
          </h1>
          <p className="text-gray-400 text-center text-sm sm:text-base mt-4 font-medium leading-relaxed max-w-sm">
            {t('subtitle')} <br/>
            <strong className="text-white">{t('slogan')}</strong>
          </p>
        </div>

        {/* ==========================================
            🔥 PANEL DE AUTENTICACIÓN DINÁMICO
        ========================================== */}
        <div className="w-full max-w-md mx-auto">
          <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl transition-all duration-500">
            
            {/* TABS PARA ALTERNAR */}
            <div className="flex bg-white/5 rounded-full p-1 mb-8">
              <button 
                onClick={() => { setIsLogin(true); setError(''); setUnverifiedEmail(''); setResendSuccess(''); }}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${isLogin ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-gray-400 hover:text-white'}`}
              >
                {t('tab_login')}
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); setUnverifiedEmail(''); setResendSuccess(''); setIsAdult(false); }}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${!isLogin ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-gray-400 hover:text-white'}`}
              >
                {t('tab_register')}
              </button>
            </div>

            {/* MENSAJES DE ERROR Y ÉXITO */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-fade-in font-medium">
                {error}
                {unverifiedEmail && (
                  <button 
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white py-2.5 rounded-lg transition-colors border border-red-500/30"
                  >
                    {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {t('btn_resend_email')}
                  </button>
                )}
              </div>
            )}

            {resendSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center animate-fade-in font-medium">
                ✅ {resendSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLogin && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* NOTIFICACIÓN VISUAL VIP */}
                  {referralCode && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-center gap-2 animate-fade-in shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                      <Gift className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400 font-bold tracking-wide">
                        {t('vip_invitation')}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('role_title')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setRole('FAN')}
                        className={`cursor-pointer border p-3 rounded-xl text-center transition-all ${role === 'FAN' ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                      >
                        <span className="text-xl block mb-1">⭐</span> {t('role_fan')}
                      </div>
                      <div 
                        onClick={() => setRole('CREATOR')}
                        className={`cursor-pointer border p-3 rounded-xl text-center transition-all ${role === 'CREATOR' ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                      >
                        <span className="text-xl block mb-1">📸</span> {t('role_creator')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('username_label')}</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder={t('username_placeholder')}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:bg-white/5 transition-all"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('email_label')}</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder={t('email_placeholder')}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:bg-white/5 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('password_label')}</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => router.push('/auth/forgot-password')}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      {t('forgot_password')}
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:bg-white/5 transition-all"
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-4 animate-fade-in mt-4">
                  
                  {/* 🔥 NUEVO: CHECKBOX LEGAL OBLIGATORIO (AHORA TRADUCIDO AL 100%) */}
                  <label className="flex items-start gap-3 p-3 border border-white/10 bg-black/40 rounded-xl cursor-pointer hover:border-red-500/50 transition-colors">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isAdult}
                        onChange={(e) => setIsAdult(e.target.checked)}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-md checked:bg-red-600 checked:border-red-600 transition-all cursor-pointer"
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <div className="text-xs text-gray-400 leading-tight">
                      {t.rich('legal_checkbox', {
                        white: (chunks) => <strong className="text-white">{chunks}</strong>,
                        terms: (chunks) => <Link href="/legal/terms" className="text-red-400 hover:underline">{chunks}</Link>,
                        privacy: (chunks) => <Link href="/legal/privacy" className="text-red-400 hover:underline">{chunks}</Link>
                      })}
                    </div>
                  </label>

                  {/* VERIFICADOR DE CONEXIÓN */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-300">{t('verifying_conn')}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protected</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || !isFormValid}
                className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  isLogin ? t('btn_login') : t('btn_register')
                )}
              </button>
            </form>

          </div>

          {/* TRUST BADGES BAJO EL FORMULARIO */}
          <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center text-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t('badge_secure')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <Lock className="w-5 h-5 text-green-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t('badge_privacy')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <CheckCircle2 className="w-5 h-5 text-purple-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t('badge_verified')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER LEGAL (SIN TRADUCIR PARA MANTENER LA LEGALIDAD BASE) */}
      <footer className="w-full border-t border-white/10 bg-[#050505] pt-8 pb-8 px-4 relative z-10 mt-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] uppercase font-black tracking-widest opacity-90">
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-red-500 text-sm">🔞</span> 18+ SOLO ADULTOS
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-blue-500 text-sm">🪪</span> KYC OBLIGATORIO
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-green-500 text-sm">🔒</span> PAGOS SEGUROS
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-purple-500 text-sm">⚖️</span> DMCA PROTECTED
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs text-blue-500 font-bold tracking-wide">
            <Link href="/legal/terms" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Términos de Servicio</Link>
            <Link href="/legal/privacy" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Política de Privacidad</Link>
            <Link href="/legal/content-policy" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Política de Contenido</Link>
            <Link href="/legal/dmca" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">DMCA</Link>
            <Link href="/legal/18plus" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Consentimiento 18+</Link>
            <Link href="/legal/2257" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">18 U.S.C. 2257</Link>
          </div>

          <div className="text-[11px] text-gray-500 space-y-3 leading-relaxed px-4 text-center max-w-4xl mx-auto font-medium">
            <p>
              Fansmio opera bajo estrictas políticas de moderación. Todo el contenido es generado por usuarios verificados mediante sistemas biométricos (KYC) y operamos bajo una política de tolerancia cero frente al contenido no consensuado. Todos los modelos han otorgado consentimiento expreso y documentado en estricto cumplimiento con 18 U.S.C. 2257.
            </p>
            <p>
              Los pagos son procesados por pasarelas seguras compatibles con el sector, garantizando la privacidad absoluta y el cumplimiento normativo internacional. El uso de esta plataforma implica la aceptación de todos nuestros términos legales.
            </p>
            <p className="pt-4 font-black tracking-widest text-gray-600">
              © {new Date().getFullYear()} FansMio. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}