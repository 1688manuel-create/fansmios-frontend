// frontend/components/ReportModal.tsx
"use client";

import { useState } from 'react';
import { Flag, X, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../lib/api';

interface ReportModalProps {
  type?: 'USER' | 'POST' | 'MESSAGE'| 'COMMENT'; 
  targetId?: string; 
  reportedUsername?: string; 
  onClose: () => void;
}

export default function ReportModal({ type = 'USER', targetId, reportedUsername, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Contenido Inapropiado / Explícito',
    'Fraude, Estafa o Spam',
    'Acoso o Abuso',
    'Suplantación de Identidad',
    'Menor de Edad',
    'Derechos de Autor (Copyright)',
    'Otro Motivo'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return alert("Por favor, selecciona un motivo.");
    if (!description.trim()) return alert("Por favor, danos un poco más de contexto en la descripción.");

    setIsSubmitting(true);
    try {
      await api.post('/reports', { 
        type,
        targetId,
        reportedUsername, 
        reason, 
        description 
      });
      alert("✅ Reporte enviado al Administrador. Gracias por ayudarnos a mantener la comunidad segura.");
      onClose();
    } catch (error) {
      alert("Hubo un error al enviar el reporte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (type === 'POST') return 'Reportar Publicación';
    if (type === 'MESSAGE') return 'Reportar Mensaje';
    return 'Reportar Usuario';
  };

  const getSubtitle = () => {
    if (type === 'POST') return '¿Qué problema tiene esta publicación?';
    if (type === 'MESSAGE') return '¿Por qué reportas este mensaje?';
    if (reportedUsername) return `¿Qué problema tienes con @${reportedUsername}?`;
    return '¿En qué podemos ayudarte? Tu reporte es confidencial.';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] nm-inset relative">
        
        {/* Luz de fondo de alerta */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* CABECERA */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f] relative z-10">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            {getTitle()}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white nm-btn p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
          
          <div>
            <p className="text-gray-400 text-sm font-medium mb-4">{getSubtitle()}</p>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block pl-1">Motivo Principal</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {reasons.map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === r ? 'nm-inset border-red-500/50 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' : 'bg-black/50 border-white/5 text-gray-300 hover:bg-white/5'}`}>
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r} 
                    checked={reason === r} 
                    onChange={(e) => setReason(e.target.value)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${reason === r ? 'border-red-500' : 'border-gray-600'}`}>
                    {reason === r && <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}
                  </div>
                  <span className="text-sm font-bold">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block pl-1">Descripción Detallada</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/50 border border-white/5 nm-inset rounded-xl p-4 text-white outline-none focus:border-red-500/50 resize-none text-sm placeholder:text-gray-600 custom-scrollbar" 
              rows={3} 
              placeholder="Explícanos brevemente qué sucedió..."
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !reason || !description.trim()} 
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Flag className="w-5 h-5" /> Enviar Reporte</>}
          </button>
        </form>

      </div>
    </div>
  );
}