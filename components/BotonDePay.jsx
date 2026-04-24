"use client";
import DePayWidgets from '@depay/widgets';

export default function BotonDePay() {
  
  const iniciarPago = async () => {
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
      title: 'Recargar Billetera Fansmios'
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