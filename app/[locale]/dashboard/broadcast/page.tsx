// frontend/app/dashboard/broadcast/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import { chatService } from '../../../../lib/chatService'; // 🔥 IMPORTAMOS EL MOTOR CENTRALIZADO
// 🔥 ICONOS PREMIUM
import { 
  Megaphone, ArrowLeft, Image as ImageIcon, Lock, 
  Send, Users, Loader2, Sparkles, DollarSign, X
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

export default function BroadcastPage() {
  const router = useRouter();
  const t = useTranslations('BroadcastPage'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [content, setContent] = useState('');
  const [isPPV, setIsPPV] = useState(false);
  const [price, setPrice] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificamos que sea un creador
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      alert(t('alert_only_creators'));
      router.push('/dashboard');
    }
  }, [router, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSendBroadcast = async () => {
    if (!content.trim() && !selectedFile) {
      alert(t('alert_missing_content'));
      return;
    }
    if (isPPV && (!price || Number(price) <= 0)) {
      alert(t('alert_invalid_price'));
      return;
    }

    const confirmSend = window.confirm(t('alert_confirm_send'));
    if (!confirmSend) return;

    setIsSending(true);
    try {
      // 🔥 LA MAGIA ARQUITECTÓNICA: Usamos el chatService en lugar de api.post directo
      await chatService.sendBroadcast(
        content, 
        isPPV ? price : '', 
        selectedFile
      );
      
      alert(t('alert_success'));
      setContent('');
      setIsPPV(false);
      setPrice('');
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error(error);
      alert(t('alert_error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 relative">
        
        {/* Luz ambiental */}
        <div className="absolute top-0 left-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2"></div>

        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h1 className="text-xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 nm-inset bg-black rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            {t('nav_title')}
          </h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('btn_back')}
          </button>
        </nav>

        <main className="max-w-3xl mx-auto mt-8 px-4 relative z-10">
          
          {/* Banner Explicativo */}
          <div className="nm-inset border border-purple-500/20 bg-[#0a0a0a] p-6 rounded-[2rem] mb-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">{t('banner_title')}</h2>
              <p className="text-gray-400 text-sm font-medium">{t('banner_desc_1')} <strong>{t('banner_desc_2')}</strong> {t('banner_desc_3')}</p>
            </div>
          </div>

          {/* Formulario Neumórfico */}
          <div className="nm-btn border border-white/5 p-6 md:p-8 rounded-[2rem] cursor-default">
            <div className="space-y-6">
              
              {/* Destinatarios */}
              <div className="flex items-center gap-3 text-gray-300 font-bold text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{t('lbl_recipients')}</span>
                <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/20">{t('val_recipients')}</span>
              </div>

              {/* Mensaje */}
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2 pl-2">{t('lbl_message')}</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('ph_message')}
                  className="w-full nm-inset rounded-2xl p-5 text-white outline-none focus:border-purple-500/50 transition-colors resize-none placeholder:text-gray-600 font-medium"
                  rows={4}
                />
              </div>

              {/* Vista Previa de Archivo */}
              {filePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 nm-inset max-w-sm">
                  {selectedFile?.type.startsWith('video') ? (
                    <video src={filePreview} className="w-full h-auto" controls />
                  ) : (
                    <img src={filePreview} alt="Preview" className="w-full h-auto object-cover" />
                  )}
                  <button onClick={() => { setFilePreview(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 nm-btn bg-black/80 hover:text-red-500 text-white rounded-full p-2 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Controles y Precio */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 nm-btn text-gray-300 hover:text-white transition-colors font-bold rounded-xl flex-1 sm:flex-none justify-center">
                    <ImageIcon className="w-4 h-4" /> {t('btn_attach')}
                  </button>
                  
                  <button onClick={() => setIsPPV(!isPPV)} className={`flex items-center gap-2 px-5 py-3 nm-btn font-bold rounded-xl transition-all flex-1 sm:flex-none justify-center ${isPPV ? 'text-green-400 border border-green-500/30 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' : 'text-gray-500 hover:text-yellow-500'}`}>
                    <Lock className="w-4 h-4" /> {t('btn_charge_ppv')}
                  </button>
                </div>

                {isPPV && (
                  <div className="relative w-full sm:w-40 animate-fade-in">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black"><DollarSign className="w-4 h-4"/></span>
                    <input 
                      type="number" min="1" step="0.01" 
                      value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder={t('ph_price')} 
                      className="w-full nm-inset rounded-xl pl-10 pr-4 py-3 text-white font-black outline-none focus:border-green-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <button 
                onClick={handleSendBroadcast}
                disabled={isSending || (!content.trim() && !selectedFile) || (isPPV && !price)}
                className="w-full nm-btn-primary py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-all mt-6 font-black"
              >
                {isSending ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> {t('btn_processing')}</>
                ) : (
                  <><Send className="w-6 h-6" /> {t('btn_send')}</>
                )}
              </button>

            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}