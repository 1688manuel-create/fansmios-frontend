"use client";
import DePayWidgets from '@depay/widgets';

// 🔥 ATENCIÓN: Añadimos { userId } como parámetro para saber a quién recargarle el saldo
export default function BotonDePay({ userId }) {
  
  const iniciarPago = async () => {

    // Validamos que el botón no se dispare "ciego" sin saber quién es el usuario
    if (!userId) {
      alert("Error: No se ha detectado tu ID de usuario.");
      return;
    }

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
        fix: 1.00 // 🔥 Ajustado a $1.00 USD para pruebas seguras
      },
      title: 'Recargar Billetera Fansmios',

      // 🚀 AQUÍ OCURRE LA MAGIA: Cuando la blockchain confirma el pago
      succeeded: async (transaction) => {
        console.log('✅ Pago detectado en la blockchain:', transaction);
        
        try {
          // El misil que conecta con tu Cuartel General
          const response = await fetch('https://api.fansmio.com/api/depay/confirmar', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionHash: transaction.id,
              userId: userId,
              amount: 1.00 // Debe coincidir con el monto cobrado arriba
            })
          });

          const data = await response.json();
          
          if (response.ok) {
            alert('¡Bóveda actualizada! Saldo inyectado con éxito. 🚀');
            window.location.reload(); // Recarga la página para mostrar el nuevo saldo al Fan
          } else {
            console.error('Error del servidor:', data);
            alert('El pago llegó a tu MetaMask, pero hubo un retraso actualizando el saldo en pantalla.');
          }

        } catch (error) {
          console.error('Error de red al contactar al backend:', error);
        }
      }
    });
  };

  return (
    <button 
      onClick={iniciarPago}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
    >
      Recargar $1.00 (Prueba)
    </button>
  );
}