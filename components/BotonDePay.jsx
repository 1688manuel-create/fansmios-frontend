"use client";
import { useState } from 'react';

export default function BotonDePay({ userId }) {
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    // Validamos que el botón no se dispare "ciego"
    if (!userId) {
      alert("Error: No se ha detectado tu ID de usuario.");
      return;
    }

    try {
      setCargando(true);

      // 🛡️ MODO SIGILO: Solo descargamos el arsenal de DePay CUANDO el Fan hace clic.
      // Esto evita que la plataforma se trabe al inicio.
      const depayModule = await import('@depay/widgets');
      const DePayWidgets = depayModule.default || depayModule;

      setCargando(false);

      // Desplegamos el widget
      await DePayWidgets.Payment({
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

        // Cuando la blockchain confirma el pago
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
      console.error("Error crítico lanzando DePay:", error);
      setCargando(false);
      alert("Hubo un problema conectando con la red Web3. Revisa tu conexión.");
    }
  };

  return (
    <button 
      onClick={iniciarPago}
      disabled={cargando}
      className="w-full bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:scale-100"
    >
      {cargando ? 'Iniciando Conexión Web3...' : 'Recargar $1.00 (Prueba)'}
    </button>
  );
}