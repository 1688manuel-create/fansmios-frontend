// frontend/app/auth/forgot-password/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Llamada al backend para enviar el correo con el token
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoración Glassmorphism */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
          
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Recuperar Acceso</h2>
            <p className="text-gray-400 text-sm">
              {isSent 
                ? 'Revisa tu bandeja de entrada.' 
                : 'Ingresa tu correo y te enviaremos un enlace mágico para volver a entrar.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {!isSent ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="tu@email.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !email.includes('@')}
                className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 'Enviar enlace mágico'}
              </button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
              <span className="text-4xl">📧</span>
              <h3 className="text-green-400 font-bold text-lg">¡Enlace enviado!</h3>
              <p className="text-gray-400 text-sm">Hemos enviado las instrucciones a <strong>{email}</strong>. Si no lo ves, revisa la carpeta de Spam.</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => router.push('/auth')} className="text-sm text-gray-500 hover:text-white transition-colors">
              ← Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}