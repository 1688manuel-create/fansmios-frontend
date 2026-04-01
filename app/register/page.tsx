"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/authService';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  
  // 🔥 NUEVO: Añadimos el estado del Username que faltaba
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FAN'); // Por defecto es Fan
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 RADAR DE ENLACES: Atrapa el código si entra por fansmio.com/register?ref=CODIGO
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🌉 Enviamos los datos al Backend (ahora incluyendo el username)
      await authService.register({ 
        username,
        email, 
        password, 
        role, 
        referralCode: referralCode || undefined // Si está vacío, no lo mandamos
      });
      
      // Si el registro es un éxito, lo mandamos al login para que entre
      router.push('/login'); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar usuario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Únete al Club</h1>
          <p className="text-gray-400 text-sm">Crea tu cuenta exclusiva</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SELECCIÓN DE ROL */}
          <div className="flex gap-4 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setRole('FAN')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'FAN' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Soy Fan
            </button>
            <button
              type="button"
              onClick={() => setRole('CREATOR')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'CREATOR' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Soy Creador
            </button>
          </div>

          <div className="space-y-4">
            
            {/* 🔥 NUEVO: CAMPO DE USERNAME */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de Usuario</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="ej: guapa_123" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="tu@email.com" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="••••••••" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Código de Referido (Opcional)</label>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Ej: 1234-abcd" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Inicia Sesión</Link>
        </p>
      </div>
    </main>
  );
}