// frontend/app/dashboard/security/page.tsx
"use client";

import { useState, useEffect } from 'react';
import AppLayout from '../../../../components/AppLayout';
import api from '../../../../lib/api';

export default function SecuritySettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para la configuración del 2FA
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const res = await api.get('/profile/me');
      setIs2FAEnabled(res.data.user?.twoFactorEnabled || false);
    } catch (error) {
      console.error("Error obteniendo estado de seguridad", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = async () => {
    try {
      const res = await api.post('/2fa/generate');
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecretKey(res.data.secret);
      setSetupMode(true);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al generar el código QR.");
    }
  };

  const handleVerifyAndEnable = async () => {
    if (tokenInput.length !== 6) {
      alert("El código debe tener exactamente 6 dígitos.");
      return;
    }

    setIsVerifying(true);
    try {
      await api.post('/2fa/verify', { token: tokenInput });
      alert("🛡️ ¡Éxito! Tu cuenta ahora está blindada con Autenticación de 2 Pasos.");
      setIs2FAEnabled(true);
      setSetupMode(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Código incorrecto o expirado.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) return <AppLayout><div className="min-h-screen flex items-center justify-center font-bold text-xl animate-pulse">Cargando Bóveda de Seguridad...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 py-10">
        
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            🔒 Centro de Seguridad
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Protege tus ganancias y tu cuenta añadiendo una capa extra de seguridad de grado militar.
          </p>
        </div>

        {is2FAEnabled ? (
          <div className="glass-panel p-8 rounded-3xl border border-green-500/50 bg-green-500/10 text-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold text-green-400">Autenticación 2FA Activada</h2>
            <p className="text-gray-300 mt-2">Tu bóveda está blindada. Nadie podrá retirar tus fondos sin acceso físico a tu teléfono celular.</p>
          </div>
        ) : !setupMode ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center hover:border-blue-500/50 transition-colors">
            <div className="text-6xl mb-4">🔓</div>
            <h2 className="text-2xl font-bold text-white">Tu cuenta es vulnerable</h2>
            <p className="text-gray-400 mt-2 mb-6 text-sm max-w-md mx-auto">
              Te recomendamos activar la Autenticación de 2 Pasos (2FA). Será obligatoria para poder retirar tus ganancias a tu billetera cripto.
            </p>
            <button 
              onClick={handleStartSetup}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform text-white font-extrabold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Activar Seguridad 2FA
            </button>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-3xl border border-blue-500/30 bg-black/50 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Configurar Google Authenticator</h2>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              
              {/* PASO 1: Escanear QR */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-bold">1. Escanea este código QR</p>
                  <p className="text-xs text-gray-500 mt-1">Usa la app de Google Authenticator o Authy.</p>
                </div>
                <div className="bg-black/50 border border-white/10 p-2 rounded-lg w-full">
                  <p className="text-[10px] text-gray-500">¿No puedes escanearlo? Usa esta clave:</p>
                  <p className="text-xs text-blue-400 font-mono tracking-widest mt-1 select-all">{secretKey}</p>
                </div>
              </div>

              {/* PASO 2: Ingresar el Código */}
              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <p className="text-sm text-gray-300 font-bold mb-2">2. Ingresa el código de 6 dígitos</p>
                  <p className="text-xs text-gray-500 mb-4">La app generará un nuevo código cada 30 segundos.</p>
                </div>
                
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Ej: 123456" 
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))} // Solo permite números
                  className="w-full bg-black border-2 border-white/10 focus:border-blue-500 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-mono outline-none transition-colors placeholder:text-gray-700"
                />

                <button 
                  onClick={handleVerifyAndEnable}
                  disabled={isVerifying || tokenInput.length !== 6}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-extrabold py-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 mt-2"
                >
                  {isVerifying ? 'Verificando...' : 'Verificar y Activar 🛡️'}
                </button>
                <button 
                  onClick={() => setSetupMode(false)}
                  className="w-full text-gray-500 hover:text-white text-sm mt-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}