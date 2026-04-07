// frontend/app/auth/verify/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../../lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Validando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace de verificación inválido o ausente.');
      return;
    }

    const verifyToken = async () => {
      try {
        // Llamamos al backend para que marque el email como verificado
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage('¡Tu cuenta ha sido verificada con éxito!');
        
        // Redirigimos al portal de login después de 3 segundos
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'El enlace ha expirado o ya fue utilizado.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="text-center space-y-6 animate-fade-in">
      {status === 'loading' && (
        <>
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-bold text-white">{message}</h2>
          <p className="text-gray-400">Por favor espera un momento...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-green-400">¡Verificado!</h2>
          <p className="text-gray-300">{message}</p>
          <p className="text-sm text-gray-500 mt-4">Redirigiendo a tu cuenta...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50">
            <span className="text-5xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400">Hubo un problema</h2>
          <p className="text-gray-300">{message}</p>
          <button 
            onClick={() => router.push('/auth')}
            className="mt-6 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition-all"
          >
            Volver al inicio
          </button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-10 rounded-[2rem] border border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl">
          <Suspense fallback={<div className="text-center text-gray-400">Cargando sistema de verificación...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}