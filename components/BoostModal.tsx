"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🔥 LA MAGIA DE LA TELETRANSPORTACIÓN
import { X, Rocket, Star, Zap, Crown, Wallet, CreditCard, Flame } from 'lucide-react';
import api from '../lib/api';
import { useTranslations } from 'next-intl';

interface BoostModalProps {
  onClose: () => void;
  creatorBalance?: number;
}

export default function BoostModal({ onClose, creatorBalance = 0 }: BoostModalProps) {
  const t = useTranslations('BoostModal');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false); // Seguro para Next.js SSR
  
  // 🔥 TÁCTICA DE VENTAS: El "Upsell"
  const [addFireBorder, setAddFireBorder] = useState(false); 
  const FIRE_BORDER_PRICE = 5.00;

  // Bloquear el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden'; // Congela la pantalla de atrás
    return () => {
      document.body.style.overflow = 'unset'; // La descongela al cerrar
    };
  }, []);

  // 💰 PAQUETES OPTIMIZADOS
  const PACKAGES = [
    {
      id: 'basic',
      name: t('pack_basic_name'), 
      price: 15.00,
      icon: Rocket,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      bgHover: 'hover:bg-blue-500/10',
      features: [t('pack_basic_f1'), t('pack_basic_f2')]
    },
    {
      id: 'pro',
      name: t('pack_pro_name'), 
      price: 25.00,
      icon: Star,
      color: 'text-yellow-400',
      borderColor: 'border-yellow-500/50',
      bgHover: 'hover:bg-yellow-500/10',
      features: [t('pack_pro_f1'), t('pack_pro_f2'), t('pack_pro_f3')]
    },
    {
      id: 'god',
      name: t('pack_god_name'),
      price: 50.00,
      icon: Crown,
      color: 'text-red-500',
      borderColor: 'border-red-500/50',
      bgHover: 'hover:bg-red-500/10',
      features: [t('pack_god_f1'), t('pack_god_f2'), t('pack_god_f3')]
    },
    // 🐋 LA BALLENA
    {
      id: 'legend',
      name: 'Leyenda Global', 
      price: 100.00,
      icon: Zap,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      bgHover: 'hover:bg-purple-500/10',
      features: ['Top 1 absoluto en Explorar', 'Mención en Newsletter a Fans', 'Duración: 1 Semana VIP']
    }
  ];

  const currentPackPrice = selectedPackage ? PACKAGES.find(p => p.id === selectedPackage)?.price || 0 : 0;
  const totalToPay = currentPackPrice + (addFireBorder ? FIRE_BORDER_PRICE : 0);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    if (creatorBalance < totalToPay) {
        alert(`❌ ${t('alert_insufficient_funds_1')} $${creatorBalance.toFixed(2)}. ${t('alert_insufficient_funds_2')}`);
        return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/promotions/buy', { 
          packageId: selectedPackage,
          addons: addFireBorder ? ['FIRE_BORDER'] : []
      });
      
      alert(`✅ ${response.data.message}`);
      window.location.reload(); 
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || t('alert_error_payment');
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Si Next.js no ha montado el componente en el navegador, no renderizamos nada
  if (!mounted) return null;

  // 🔥 CREAMOS EL PORTAL: Envía el HTML directo al <body> tapando absolutamente todo
  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      style={{ zIndex: 9999999, backgroundColor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)' }}
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-4xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative">
        
        {/* HEADER (Congelado arriba) */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-[#0e0e0e] shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" /> {t('modal_title')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white nm-btn p-2 rounded-full transition-colors bg-white/5" title={t('btn_close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO - SELECCIÓN DE PAQUETES (Scroll Interno) */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#0a0a0a] to-black">
          <p className="text-center text-gray-400 font-medium text-xs sm:text-base px-2">{t('modal_desc')}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {PACKAGES.map((pack) => (
              <div 
                key={pack.id} 
                onClick={() => setSelectedPackage(pack.id)}
                className={`cursor-pointer nm-inset border-2 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center transition-all duration-300 ${selectedPackage === pack.id ? `border-current ${pack.color} scale-[1.02] bg-white/5` : `${pack.borderColor} text-gray-500 hover:text-gray-300 ${pack.bgHover}`}`}
              >
                <pack.icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 ${selectedPackage === pack.id ? pack.color : 'text-gray-600'}`} />
                <h3 className="font-black text-base sm:text-lg mb-1 text-white">{pack.name}</h3>
                <p className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">${pack.price}</p>
                <ul className="text-[9px] sm:text-[10px] uppercase tracking-widest space-y-2 text-left w-full border-t border-white/5 pt-3 sm:pt-4">
                  {pack.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">✓</span> <span className="text-gray-400 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 🔥 UPSELL */}
          {selectedPackage && (
            <div 
              onClick={() => setAddFireBorder(!addFireBorder)}
              className={`mt-2 sm:mt-4 border-2 rounded-2xl p-3 sm:p-4 flex items-center justify-between cursor-pointer transition-all ${addFireBorder ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-black hover:border-white/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${addFireBorder ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'bg-white/5 text-gray-500'}`}>
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <h4 className={`font-black text-xs sm:text-sm ${addFireBorder ? 'text-orange-400' : 'text-gray-300'}`}>Borde de Fuego Animado</h4>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Haz que tu avatar resalte aún más</p>
                </div>
              </div>
              <div className="font-bold text-base sm:text-lg text-white shrink-0">
                +${FIRE_BORDER_PRICE}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER - PAGO */}
        <div className="p-4 sm:p-6 bg-[#0e0e0e] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="text-xs sm:text-sm font-bold text-gray-400 flex items-center gap-2 nm-inset px-4 py-2 sm:py-2.5 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
            <Wallet className="w-4 h-4 text-green-500" /> {t('lbl_my_balance')}: <span className="text-white">${creatorBalance > 0 ? creatorBalance.toFixed(2) : '0.00'}</span>
          </div>
          
          <button 
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className="nm-btn-primary px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            {isProcessing ? t('btn_processing') : (
              <>
                <CreditCard className="w-5 h-5"/> 
                {selectedPackage ? `Pagar $${totalToPay.toFixed(2)}` : t('btn_pay_promote')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body // ¡EL DESTINO DE LA TELETRANSPORTACIÓN!
  );
}