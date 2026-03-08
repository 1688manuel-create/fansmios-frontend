// frontend/app/dashboard/live/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { liveService } from '../../../lib/liveService'; // 🔥 Usamos el servicio centralizado

export default function LiveSetupLobby() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Ponle un título atractivo a tu Live.");
    if (isPPV && (!price || price < 1)) return alert("El precio mínimo de entrada es $1.00");

    setIsStarting(true);
    try {
      // 🔥 Llamamos al servicio que ya tiene la ruta '/create' correcta
      const res = await liveService.createStream(title, isPPV, isPPV ? Number(price) : 0);

      // 🔥 El backend nos devuelve el ID de la sala. Teletransportamos al creador a su CABINA.
      router.push(`/live/${res.streamId || res.liveStream?.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al iniciar la sala de transmisión.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 sm:p-10 flex flex-col items-center justify-center relative">
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      <button onClick={() => router.push('/dashboard')} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
        ← Volver al Dashboard
      </button>

      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-lg w-full border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10 bg-black/40 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            🎙️
          </div>
          <h1 className="text-3xl font-extrabold text-white">Configurar Live</h1>
          <p className="text-gray-400 text-sm mt-2">Prepara tu sala de transmisión antes de salir al aire.</p>
        </div>

        <form onSubmit={handleStartLive} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Título del Live</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ej: Charla privada + Sorteo 🎉" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors"
              maxLength={60}
            />
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Cobrar Entrada (Ticket PPV)</p>
                <p className="text-[10px] text-gray-500 mt-1">Los VIPs y visitantes deberán pagar para entrar.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isPPV} onChange={() => setIsPPV(!isPPV)} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {isPPV && (
              <div className="pt-4 border-t border-white/5 animate-fade-in">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Precio del Ticket ($ USD)</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">$</span>
                  <input 
                    type="number" 
                    min="1" step="0.01" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))} 
                    placeholder="5.00" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white font-bold outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isStarting || !title}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isStarting ? <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div> : 'Crear Sala y Obtener Clave 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}