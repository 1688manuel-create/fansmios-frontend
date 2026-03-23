"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Loader2, Mail } from 'lucide-react';

export default function AuthPortal() {
  const router = useRouter();
  
  // UX States
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🔥 NUEVOS ESTADOS PARA REENVIAR CORREO
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'FAN' | 'CREATOR'>('FAN');

  const isFormValid = isLogin 
    ? email.includes('@') && password.length >= 6 
    : email.includes('@') && password.length >= 6 && username.length >= 3;

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
        
        // REDIRECCIÓN INTELIGENTE
        if (res.data.user.role === 'CREATOR') {
            router.push('/dashboard');
        } else if (res.data.user.role === 'FAN' && res.data.user.creatorProfile?.kycStatus !== 'NONE') {
            router.push('/dashboard/kyc');
        } else {
            router.push('/feed');
        }
        
      } else {
        // LÓGICA DE REGISTRO
        await api.post('/auth/register', { username, email, password, role });
        
        setIsLogin(true);
        alert('✨ ¡Cuenta creada! Hemos enviado un enlace de seguridad a tu correo para activarla.');
        setPassword('');
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.error || 'Error de conexión. Intenta de nuevo.');
      
      // 🔥 SI EL BACKEND DICE QUE FALTA VERIFICAR CORREO, GUARDAMOS EL EMAIL
      if (errorData?.needsVerification && errorData?.email) {
        setUnverifiedEmail(errorData.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FUNCIÓN PARA REENVIAR EL CORREO
  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResendSuccess(res.data.message || 'Correo reenviado con éxito. Revisa tu bandeja de entrada o SPAM.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reenviar el correo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">
            Fansmio
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? 'Bienvenido de vuelta a tu espacio VIP.' : 'Únete a la plataforma premium de creadores.'}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl transition-all duration-500">
          
          <div className="flex bg-white/5 rounded-full p-1 mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setUnverifiedEmail(''); setResendSuccess(''); }}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${isLogin ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setUnverifiedEmail(''); setResendSuccess(''); }}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${!isLogin ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Registrarse
            </button>
          </div>

          {/* MENSAJES DE ERROR Y ÉXITO */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-fade-in font-medium">
              {error}
              
              {/* 🔥 BOTÓN MÁGICO PARA REENVIAR CORREO */}
              {unverifiedEmail && (
                <button 
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white py-2.5 rounded-lg transition-colors border border-red-500/30"
                >
                  {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Reenviar correo de activación
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Quiero ser un...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setRole('FAN')}
                      className={`cursor-pointer border p-3 rounded-xl text-center transition-all ${role === 'FAN' ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                      <span className="text-xl block mb-1">⭐</span> Fan
                    </div>
                    <div 
                      onClick={() => setRole('CREATOR')}
                      className={`cursor-pointer border p-3 rounded-xl text-center transition-all ${role === 'CREATOR' ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                      <span className="text-xl block mb-1">📸</span> Creador
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="ej. creador_pro"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:bg-white/5 transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="tu@email.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:bg-white/5 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => router.push('/auth/forgot-password')}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:bg-white/5 transition-all"
                required
              />
            </div>

            {!isLogin && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-300">Verificando conexión segura...</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protected</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || !isFormValid}
              className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                isLogin ? 'Acceder al Imperio' : 'Crear Cuenta'
              )}
            </button>
          </form>

        </div>
        
        <p className="text-center text-xs text-gray-600 mt-6 px-4">
          Al continuar, aceptas nuestros <span className="underline cursor-pointer hover:text-gray-400">Términos de Servicio</span> y la <span className="underline cursor-pointer hover:text-gray-400">Política de Privacidad</span>.<br/>
          Protegido por seguridad de grado militar.
        </p>
      </div>
    </div>
  );
}