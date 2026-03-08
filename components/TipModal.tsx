// frontend/components/TipModal.tsx
"use client";

import { useState } from 'react';

interface TipModalProps {
  creatorName: string;
  onClose: () => void;
  onContinue: (amount: number, message: string) => void;
}

export default function TipModal({ creatorName, onClose, onContinue }: TipModalProps) {
  const [amount, setAmount] = useState<number | ''>(10); // $10 por defecto
  const [message, setMessage] = useState('');
  
  const presetAmounts = [5, 10, 20, 50, 100];

  const handleContinue = () => {
    if (!amount || amount < 1) {
      alert("El monto mínimo es de $1.00");
      return;
    }
    onContinue(Number(amount), message);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-8 rounded-[2rem] max-w-md w-full border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none"></div>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors z-10"
        >
          ✕
        </button>

        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg border-2 border-yellow-300/50">
            💸
          </div>
          <h2 className="text-2xl font-bold text-white">Enviar Propina</h2>
          <p className="text-gray-400 text-sm mt-1">Apoya el contenido de <span className="text-yellow-400 font-bold">@{creatorName}</span></p>
        </div>

        <div className="space-y-6 relative z-10">
          
          {/* BOTONES RÁPIDOS */}
          <div className="grid grid-cols-5 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`py-2 rounded-xl font-bold text-sm transition-all border ${amount === preset ? 'bg-yellow-500 text-black border-yellow-400 scale-105 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-black/50 text-gray-300 border-white/10 hover:border-yellow-500/50'}`}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* MONTO PERSONALIZADO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Monto Personalizado ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-bold text-xl">$</span>
              <input 
                type="number" 
                min="1"
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))} 
                placeholder="0.00"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-xl font-bold outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>

          {/* MENSAJE ADJUNTO (Opcional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mensaje (Opcional)</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej. ¡Me encantó este post! Sigue así 😍"
              rows={2}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 transition-colors resize-none text-sm"
            />
          </div>

          <button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-yellow-500 to-green-500 text-black font-extrabold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2"
          >
            Continuar al Pago <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}