// frontend/app/auth/reset-password/page.tsx
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Atrapamos el token de la URL

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (newPassword.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setIsSuccess(true);
      // Redirigimos al login después de 3 segundos
      setTimeout(() => router.push('/auth'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'El enlace es inválido o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-red-400 p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
        ❌ Enlace inválido. Falta el token de seguridad.
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
          <span className="text-4xl">✨</span>
        </div>
        <h3 className="text-white font-bold text-xl">¡Contraseña actualizada!</h3>
        <p className="text-gray-400">Redirigiendo a tu cuenta...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nueva Contraseña</label>
        <input 
          type="password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          placeholder="••••••••"
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
        <input 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          placeholder="••••••••"
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all"
          required
        />
      </div>

      {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex justify-center shadow-lg shadow-green-500/20"
      >
        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Guardar y Entrar'}
      </button>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Crea una nueva llave</h2>
            <p className="text-gray-400 text-sm">Elige una contraseña segura y no la compartas con nadie.</p>
          </div>
          
          {/* El Suspense es requerido por Next.js al usar useSearchParams */}
          <Suspense fallback={<div className="text-center text-gray-400 animate-pulse">Cargando credenciales seguras...</div>}>
            <ResetPasswordForm />
          </Suspense>
          
        </div>
      </div>
    </div>
  );
}