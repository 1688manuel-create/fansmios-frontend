"use client";

import { useState } from 'react';
import { X, Rocket, Star, Zap, Crown, Wallet, CreditCard } from 'lucide-react';
import api from '../lib/api';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

interface BoostModalProps {
  onClose: () => void;
  creatorBalance?: number; // Saldo de su wallet
}

const PACKAGES = [
  {
    id: 'basic',
    name: 'Impulso Básico',
    price: 15.00,
    icon: Rocket,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgHover: 'hover:bg-blue-500/10',
    features: ['1 Post Inyectado en el Feed de todos', 'Duración: 24 Horas']
  },
  {
    id: 'pro',
    name: 'Trending VIP',
    price: 25.00,
    icon: Star,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    bgHover: 'hover:bg-yellow-500/10',
    features: ['Apareces en "Trending VIP" (Escritorio)', 'Post Inyectado en el Feed', 'Duración: 48 Horas']
  },
  {
    id: 'god',
    name: 'Fama Nivel Dios',
    price: 50.00,
    icon: Crown,
    color: 'text-red-500',
    borderColor: 'border-red-500/50',
    bgHover: 'hover:bg-red-500/10',
    features: ['Historia Dorada VIP Global', 'Notificación Push a todos los usuarios', 'Duración: Fin de semana completo']
  }
];

export default function BoostModal({ onClose, creatorBalance = 0 }: BoostModalProps) {
  const t = useTranslations('BoostModal');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    }
  ];

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    const pack = PACKAGES.find(p => p.id === selectedPackage);
    
    if (!pack) return;

    if (creatorBalance < pack.price) {
        alert(`❌ ${t('alert_insufficient_funds_1')} $${creatorBalance.toFixed(2)}. ${t('alert_insufficient_funds_2')}`);
        return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/promotions/buy', { 
          packageId: pack.id 
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

  return (
    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0e0e0e]">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" /> {t('modal_title')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white nm-btn p-2 rounded-full transition-colors" title={t('btn_close')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO - SELECCIÓN DE PAQUETES */}
        <div className="p-6 space-y-6">
          <p className="text-center text-gray-400 font-medium">{t('modal_desc')}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PACKAGES.map((pack) => (
              <div 
                key={pack.id} 
                onClick={() => setSelectedPackage(pack.id)}
                className={`cursor-pointer nm-inset border-2 rounded-2xl p-5 flex flex-col items-center text-center transition-all ${selectedPackage === pack.id ? `border-current ${pack.color} scale-105 bg-white/5` : `${pack.borderColor} text-gray-500 hover:text-gray-300 ${pack.bgHover}`}`}
              >
                <pack.icon className={`w-10 h-10 mb-3 ${selectedPackage === pack.id ? pack.color : 'text-gray-600'}`} />
                <h3 className="font-black text-lg mb-1 text-white">{pack.name}</h3>
                <p className="text-2xl font-bold mb-4">${pack.price}</p>
                <ul className="text-[10px] uppercase tracking-widest space-y-2 text-left w-full border-t border-white/5 pt-4">
                  {pack.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">✓</span> <span className="text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER - PAGO */}
        <div className="p-6 bg-[#0e0e0e] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-bold text-gray-400 flex items-center gap-2 nm-inset px-4 py-2 rounded-xl border border-white/5">
            <Wallet className="w-4 h-4 text-green-500" /> {t('lbl_my_balance')}: <span className="text-white">${creatorBalance > 0 ? creatorBalance.toFixed(2) : '0.00'}</span>
          </div>
          
          <button 
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className="nm-btn-primary px-10 py-3 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {isProcessing ? t('btn_processing') : <><CreditCard className="w-5 h-5"/> {t('btn_pay_promote')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}