// frontend/app/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/authService';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página recargue
    setError('');
    setLoading(true);

    try {
      // 🌉 Usamos el puente que construimos para hablar con el Backend
      await authService.login({ email, password });
      
      // Si el login es un éxito, lo mandamos al muro (Feed)
      router.push('/feed'); 
    } catch (err: any) {
      // Si el backend nos rechaza (ej: contraseña incorrecta), mostramos el error
      setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Bienvenido de vuelta</h1>
          <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Muestra errores en rojo si los hay */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          ¿No tienes una cuenta? <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">Regístrate aquí</Link>
        </p>
      </div>
    </main>
  );
}