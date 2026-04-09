"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../../lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

// 1. Separamos la lógica en un componente interno
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('VerifyAduana'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [message, setMessage] = useState('Verificando tu bóveda de seguridad...');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setStatus('ERROR');
      setMessage(t('error_no_token'));
    }
  }, [token, t]); // Agregamos 't' a las dependencias

  const verifyToken = async (verificationToken: string) => {
    try {
      const res = await api.post('/auth/verify-email', { token: verificationToken });
      setStatus('SUCCESS');
      setMessage(res.data.message || t('success_msg'));
    } catch (error: any) {
      setStatus('ERROR');
      setMessage(error.response?.data?.error || t('error_invalid_link'));
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Luces de fondo premium */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">
            Fansmio
          </h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-bold">{t('subtitle')}</p>
        </div>

        {/* CONTENEDOR DE CRISTAL */}
        <div className="glass-panel p-10 rounded-[2rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl text-center transition-all duration-500">
          
          {status === 'LOADING' && (
            <div className="flex flex-col items-center animate-fade-in">
              <Loader2 className="w-20 h-20 text-purple-500 animate-spin mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              <h2 className="text-2xl font-black text-white mb-2">{t('loading_title')}</h2>
              <p className="text-gray-400 font-medium">{message || t('loading_desc')}</p>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full"></div>
                <CheckCircle2 className="w-20 h-20 text-green-400 relative z-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{t('success_title')}</h2>
              <p className="text-green-400 font-medium mb-8 text-sm">{message}</p>
              
              <button 
                onClick={() => router.push('/auth')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-extrabold py-4 rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {t('btn_login')} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full"></div>
                <XCircle className="w-20 h-20 text-red-500 relative z-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{t('error_title')}</h2>
              <p className="text-red-400 font-medium mb-8 text-sm">{message}</p>
              
              <button 
                onClick={() => router.push('/auth')}
                className="w-full bg-white/10 text-white border border-white/20 font-extrabold py-4 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                {t('btn_back')}
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" /> {t('footer_sec')}
        </p>
      </div>
    </div>
  );
}

// 2. Exportamos la página envuelta en la "Burbuja" de Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Loader2 className="w-20 h-20 text-purple-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}