"use client";

import { useState } from 'react';
import api from '../../../../lib/api'; // Ajusta esta ruta según dónde esté tu archivo api.js
import { VolumeX, AlertTriangle } from 'lucide-react';

interface MuteButtonProps {
  postId: string;
  isMutedInitially?: boolean;
}

export default function MuteVideoButton({ postId, isMutedInitially = false }: MuteButtonProps) {
  const [isMuting, setIsMuting] = useState(false);
  const [isMuted, setIsMuted] = useState(isMutedInitially);

  const handleMute = async () => {
    const confirmMessage = "🚨 ALERTA ROJA: ¿Seguro que quieres extirpar el audio de este video por Copyright?\n\nEsta acción modificará el archivo original y NO se puede deshacer.";
    
    if (!window.confirm(confirmMessage)) return;

    setIsMuting(true);
    try {
      // Disparamos la orden al backend (Ajusta la ruta si tu prefijo de moderación es diferente)
      const response = await api.post('/moderation/mute-video', { postId });
      
      alert(`💥 ÉXITO: ${response.data.message}`);
      setIsMuted(true); // Actualizamos la pantalla para que muestre que ya está mudo
      
    } catch (error: any) {
      console.error("Error en Protocolo de Silencio:", error);
      alert(error.response?.data?.error || "Fallo crítico al intentar silenciar el video.");
    } finally {
      setIsMuting(false);
    }
  };

  // Si el video ya fue silenciado, mostramos una etiqueta de advertencia fija
  if (isMuted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] bg-red-500/10 text-red-500 font-black px-3 py-1.5 rounded-full border border-red-500/30 uppercase tracking-widest cursor-default">
        <VolumeX className="w-3.5 h-3.5" /> 
        Audio Eliminado (DMCA)
      </span>
    );
  }

  // El botón rojo letal para disparar
  return (
    <button
      onClick={handleMute}
      disabled={isMuting}
      className={`inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-lg uppercase tracking-wider transition-all shadow-lg 
        ${isMuting 
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:scale-105 hover:shadow-red-500/50'
        }`}
    >
      {isMuting ? (
        'CORTANDO AUDIO...'
      ) : (
        <>
          <VolumeX className="w-4 h-4" />
          Silenciar Video (DMCA)
        </>
      )}
    </button>
  );
}