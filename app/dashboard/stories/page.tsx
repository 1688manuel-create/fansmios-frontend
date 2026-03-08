// frontend/app/dashboard/stories/page.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function StoriesDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Simulamos la vista previa
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      alert("¡Historia publicada! Estará visible por 24 horas. ⏱️");
      setIsUploading(false);
      setSelectedImage(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-20 bg-black">
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
        <h1 className="text-xl font-bold text-white">⏱️ Mis Historias</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20">Volver</button>
      </nav>

      <main className="max-w-4xl mx-auto mt-10 px-4 space-y-8">
        
        {/* ZONA DE SUBIDA */}
        <div className="glass-panel p-8 rounded-3xl border border-pink-500/30 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-3xl">
            📸
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Sube una nueva Historia</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">Comparte momentos de tu día. Las historias desaparecen automáticamente después de 24 horas.</p>
          </div>

          <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

          {!selectedImage ? (
            <button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              Seleccionar Archivo
            </button>
          ) : (
            <div className="space-y-4 w-full max-w-sm">
              <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-[9/16] bg-black">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500">✕</button>
              </div>
              <button onClick={handleUpload} disabled={isUploading} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
                {isUploading ? 'Subiendo...' : 'Publicar en mi Historia'}
              </button>
            </div>
          )}
        </div>

        {/* HISTORIAS ACTIVAS (Simuladas) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Historias Activas (24h)</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {/* Círculo de añadir */}
            <div onClick={() => fileInputRef.current?.click()} className="min-w-[80px] w-20 h-20 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
              <span className="text-gray-500 text-2xl">+</span>
            </div>
            {/* Historia Simulada */}
            <div className="min-w-[80px] w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-pink-500 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-black border-2 border-black overflow-hidden relative">
                <div className="absolute inset-0 bg-pink-900/50 flex items-center justify-center text-xs text-white">Vista</div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}