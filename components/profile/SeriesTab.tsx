// frontend/components/profile/SeriesTab.tsx
import { useState } from 'react';
import api from '../../lib/api';
import { Lock, Unlock, PlayCircle } from 'lucide-react';

export default function SeriesTab({ series, onPurchaseSuccess }: { series: any[], onPurchaseSuccess: () => void }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleBuy = async (seriesId: string, price: number) => {
    const confirm = window.confirm(`Vas a desbloquear esta serie por $${price} USD. Se descontará de tu Covra Pay. ¿Continuar?`);
    if (!confirm) return;

    setProcessingId(seriesId);
    try {
      await api.post(`/series/${seriesId}/buy`);
      alert("✅ ¡Serie Desbloqueada! Ya puedes ver los videos.");
      onPurchaseSuccess(); // Recarga los datos para mostrar los videos
    } catch (error: any) {
      alert(error.response?.data?.error || "Error al procesar la compra.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!series || series.length === 0) {
    return <div className="text-center py-20 text-gray-500 font-bold">No hay series disponibles aún.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {series.map((s) => (
        <div key={s.id} className="glass-panel border border-white/10 rounded-3xl overflow-hidden bg-black/40 hover:bg-black/60 transition-all flex flex-col">
          
          {/* PORTADA */}
          <div className="h-48 bg-zinc-900 relative">
            {s.thumbnail ? (
              <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">Sin Portada</div>
            )}
            {!s.isUnlocked && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Lock className="w-12 h-12 text-white/50" />
              </div>
            )}
          </div>

          {/* INFORMACIÓN */}
          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
            <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2">{s.description}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                <PlayCircle className="w-4 h-4" /> {s.episodes?.length || 0} Episodios
              </span>
              
              {s.isUnlocked ? (
                <span className="text-green-400 font-bold text-sm flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full">
                  <Unlock className="w-4 h-4" /> Desbloqueado
                </span>
              ) : (
                <button 
                  onClick={() => handleBuy(s.id, s.price)}
                  disabled={processingId === s.id}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-5 rounded-full transition-all text-sm shadow-[0_0_10px_rgba(147,51,234,0.3)] disabled:opacity-50"
                >
                  {processingId === s.id ? "Procesando..." : `Desbloquear $${s.price}`}
                </button>
              )}
            </div>
          </div>

          {/* LISTA DE VIDEOS (Solo si está desbloqueado) */}
          {s.isUnlocked && s.episodes?.length > 0 && (
            <div className="bg-white/5 p-4 space-y-2 border-t border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
              {s.episodes.map((ep: any, index: number) => (
                <a key={ep.id} href={ep.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/50 hover:bg-purple-900/30 rounded-xl transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs group-hover:bg-purple-500 group-hover:text-white transition-all">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{ep.title}</p>
                  </div>
                  <PlayCircle className="w-5 h-5 text-gray-500 group-hover:text-purple-400" />
                </a>
              ))}
            </div>
          )}

        </div>
      ))}
    </div>
  );
}