"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { liveService } from '../../../lib/liveService';
import { 
  Tv, 
  ArrowLeft, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  Lock 
} from 'lucide-react';

export default function LiveSetupLobby() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛡️ VALIDACIONES DE SEGURIDAD PAYRAM
    if (!title.trim()) return alert("⚠️ Ponle un título atractivo a tu transmisión.");
    
    const finalPrice = isPPV ? Number(price) : 0;
    
    if (isPPV && (isNaN(finalPrice) || finalPrice < 1)) {
      return alert("⚠️ El precio mínimo para un evento PPV es de $1.00 USD.");
    }

    setIsStarting(true);
    try {
      // 🚀 CREACIÓN DEL EVENTO EN EL MOTOR CENTRAL
      const res = await liveService.createStream(title, isPPV, finalPrice);

      const streamId = res.streamId || res.liveStream?.id;

      if (!streamId) throw new Error("No se pudo obtener el ID de la sala.");

      // ⚡ TELETRANSPORTACIÓN A LA CABINA DE TRANSMISIÓN
      router.push(`/live/${streamId}`);
    } catch (error: any) {
      console.error("Error al iniciar Live:", error);
      alert(error.response?.data?.error || "Error al conectar con el servidor de streaming.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-nm-base flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Luces de ambiente sutiles (PayRam Rojo/Púrpura) */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"></div>
      
      {/* BOTÓN VOLVER */}
      <button 
        onClick={() => router.push('/dashboard')} 
        className="absolute top-8 left-8 nm-btn p-3 rounded-full text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Panel de Control</span>
      </button>

      <div className="max-w-lg w-full animate-fade-in">
        <div className="nm-btn border border-white/5 p-8 sm:p-12 rounded-[2.5rem] relative z-10">
          
          {/* HEADER DEL LOBBY */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-black nm-inset rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <Tv className="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Iniciar Transmisión</h1>
            <p className="text-gray-500 text-sm mt-3 font-medium leading-relaxed">
              Configura los parámetros de acceso para tus fans antes de salir al aire.
            </p>
          </div>

          <form onSubmit={handleStartLive} className="space-y-8">
            
            {/* TÍTULO DEL LIVE */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-red-500" /> Título de la Sala
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ej: Charla VIP + Sorteo 🔥" 
                className="w-full nm-inset bg-black border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-red-500/50 transition-all font-bold placeholder:text-gray-700"
                maxLength={60}
                required
              />
            </div>

            {/* CONFIGURACIÓN DE PAGO (PAYWALL) */}
            <div className="nm-inset bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0a0a0a] nm-btn rounded-xl flex items-center justify-center border border-white/5">
                    <Lock className={`w-5 h-5 ${isPPV ? 'text-red-500' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-wide">Acceso Privado (PPV)</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Cobrar entrada con PayRam</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPPV} 
                    onChange={() => setIsPPV(!isPPV)} 
                  />
                  <div className="w-12 h-6 bg-gray-800 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                </label>
              </div>

              {isPPV && (
                <div className="pt-6 border-t border-white/5 animate-slide-up">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-3">
                    Precio del Ticket (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-black nm-inset rounded-lg flex items-center justify-center border border-white/5">
                      <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      step="0.50" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="5.00" 
                      className="w-full nm-inset bg-black border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-white font-black text-xl outline-none focus:border-green-500/50 transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.15em] mt-3 text-center">
                    Tú recibes el 70% de cada ticket vendido
                  </p>
                </div>
              )}
            </div>

            {/* BOTÓN DE ACCIÓN */}
            <button 
              type="submit" 
              disabled={isStarting || !title.trim()}
              className="w-full nm-btn-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isStarting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white" />
                  CREAR SALA Y SALIR AL AIRE
                </>
              )}
            </button>
            
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Transmisión Protegida por PayRam
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}