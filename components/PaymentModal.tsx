"use client";

import { useState } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  TicketPercent, 
  Loader2, 
  Lock,
  CheckCircle2
} from 'lucide-react';

interface PaymentModalProps {
  clientSecret?: string;
  price: number;
  creatorId: string;
  onClose: () => void;
  onSuccess: (appliedCouponId?: string) => void;
  payAddress?: string;
  amountUsd?: number;
  transactionId?: string;
}

export default function PaymentModal({ 
  price, 
  onClose, 
  onSuccess,
  payAddress,
  amountUsd
}: PaymentModalProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(couponCode && couponApplied ? 'cupon_aplicado_123' : undefined);
    }, 2000);
  };

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    setCouponApplied(true);
  };

  const ONRAMPER_API_KEY = process.env.NEXT_PUBLIC_ONRAMPER_API_KEY || 'pk_test_x5M_5fdXtc1fOQm3Z0fSRVwAAc23B86iI-e6q1o70U00'; 
  
  // 🛡️ ESCUDO PAYRAM: Si el monto no existe, usamos 0 para evitar el crash.
  const safePrice = price || 0;
  const finalPrice = amountUsd || safePrice;
  
  const onramperIframeUrl = `https://buy.onramper.com/?apiKey=${ONRAMPER_API_KEY}&themeName=dark&containerColor=0a0a0a&primaryColor=ef4444&secondaryColor=0e0e0e&cardColor=111111&primaryTextColor=ffffff&secondaryTextColor=9ca3af&defaultCrypto=USDT&defaultFiat=USD&defaultAmount=${finalPrice}&wallets=TRX:${payAddress}&fontFamily=Inter`;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 md:p-8 max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col md:flex-row gap-8 nm-inset">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500"></div>
        
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-gray-500 hover:text-white nm-btn w-10 h-10 rounded-full flex items-center justify-center transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 flex flex-col pt-2">
          <div className="mb-8">
            <div className="w-16 h-16 nm-inset border border-white/5 rounded-2xl flex items-center justify-center text-red-500 shadow-inner mb-6">
              <CreditCard className="w-8 h-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Completar Pago</h2>
            <p className="text-gray-400 text-sm mt-2 font-medium">Estás a un paso de desbloquear contenido exclusivo.</p>
          </div>

          <div className="nm-inset border border-white/5 rounded-2xl p-6 mb-8 flex-1">
            <div className="flex justify-between items-center mb-4 text-gray-400 text-sm font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              {/* 🛡️ APLICAMOS EL ESCUDO AL TOFIXED */}
              <span className="text-white">${safePrice.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center mb-4 text-gray-400 text-sm font-bold uppercase tracking-widest">
              <span>Comisión Bancaria</span>
              <span className="text-green-400">Cubierta</span>
            </div>
            {couponApplied && (
               <div className="flex justify-between items-center mb-4 text-green-400 text-sm font-bold uppercase tracking-widest">
                 <span>Descuento</span>
                 <span>-10%</span>
               </div>
            )}
            
            <div className="w-full h-px bg-white/5 my-5"></div>
            
            <div className="flex justify-between items-end text-white">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                {/* 🛡️ APLICAMOS EL ESCUDO AL TOFIXED */}
                ${couponApplied ? (safePrice * 0.9).toFixed(2) : safePrice.toFixed(2)} <span className="text-lg text-red-700">USD</span>
              </span>
            </div>
          </div>

          <div className="mt-auto">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1 flex items-center gap-1.5">
              <TicketPercent className="w-3 h-3" /> ¿Tienes un cupón promocional?
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ej: FANSVIP" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponApplied}
                className="flex-1 nm-inset border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 transition-colors uppercase font-bold text-sm tracking-widest disabled:opacity-50"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={!couponCode || couponApplied}
                className="nm-btn border border-white/5 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {couponApplied ? <><CheckCircle2 className="w-4 h-4 text-green-500"/> Listo</> : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col relative">
          <div className="bg-[#0e0e0e] border border-white/5 rounded-[2rem] h-[500px] w-full overflow-hidden relative shadow-2xl">
            {!payAddress ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-nm-base z-10">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-white font-bold text-lg">Iniciando pasarela segura...</p>
              </div>
            ) : (
              <iframe 
                src={onramperIframeUrl}
                height="100%" width="100%" title="Pago Seguro" allow="accelerometer; autoplay; camera; gyroscope; payment"
                className="border-none w-full h-full relative z-10"
              />
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="mt-6 nm-btn border-dashed border-yellow-500/50 text-yellow-500 font-bold py-3 rounded-xl hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/> Simulando...</> : <><ShieldCheck className="w-4 h-4" /> [DEV] Simular Pago Exitoso</>}
            </button>
          )}

          <p className="text-[10px] text-gray-500 text-center mt-5 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
            <Lock className="w-3 h-3"/> Encriptación AES-256 PayRam
          </p>
        </div>

      </div>
    </div>
  );
}