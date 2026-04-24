"use client";
import { useState } from 'react';
import Script from 'next/script'; // 🔥 El inyector nativo de Next.js

export default function BotonDePay({ userId }) {
  const [cargando, setCargando] = useState(false);
  const [scriptCargado, setScriptCargado] = useState(false);

  const iniciarPago = async () => {
    if (!userId) {
      alert("Error: No se ha detectado tu ID de usuario.");
      return;
    }

    // Verificamos que el script de la nube ya haya bajado
    if (!scriptCargado || typeof window === 'undefined' || !window.DePayWidgets) {
      alert("El motor Web3 aún se está conectando. Intenta en un segundo.");
      return;
    }

    try {
      setCargando(true);

      // 🚀 LLAMADA A LA BURBUJA AISLADA DE DEPAY (window.DePayWidgets)
      await window.DePayWidgets.Payment({
        accept: [
          {
            blockchain: 'base',
            token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH nativo
            receiver: '0x01DA0aE56760592C384E7c1A0632b753cF51F683' // Tu MetaMask Personal
          }
        ],
        amount: {
          currency: 'USD',
          fix: 1.00 // Monto de prueba seguro
        },
        title: 'Recargar Billetera Fansmios',

        succeeded: async (transaction) => {
          console.log('✅ Pago detectado en la blockchain:', transaction);
          
          try {
            const response = await fetch('https://api.fansmio.com/api/depay/confirmar', { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                transactionHash: transaction.id,
                userId: userId,
                amount: 1.00 
              })
            });

            if (response.ok) {
              alert('¡Bóveda actualizada! Saldo inyectado con éxito. 🚀');
              window.location.reload(); 
            } else {
              alert('El pago llegó a tu MetaMask, pero hubo un retraso actualizando el saldo en pantalla.');
            }
          } catch (error) {
            console.error('Error de red al contactar al backend:', error);
          }
        }
      });

    } catch (error) {
      console.error("Error lanzando DePay:", error);
      // Si el usuario simplemente cierra la ventana, quitamos el estado de carga
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* 📡 LA ANTENA CDN: Trae DePay desde la nube oficial sin romper tu código */}
      <Script 
        src="https://integrate.depay.com/widgets/v13.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptCargado(true)}
      />

      <button 
        onClick={iniciarPago}
        disabled={cargando || !scriptCargado}
        className="w-full bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:scale-100"
      >
        {!scriptCargado ? 'Conectando Antena Web3...' : cargando ? 'Abriendo Billetera...' : 'Recargar $1.00 (Prueba)'}
      </button>
    </>
  );
}