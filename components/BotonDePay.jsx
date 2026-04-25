"use client";
import { useState } from 'react';

export default function BotonDePay({ userId }) {
  const [cargando, setCargando] = useState(false);

  const iniciarPagoNativo = async () => {
    if (!userId) {
      alert("Error: No se ha detectado tu ID de usuario.");
      return;
    }

    // 1. Verificamos si el Fan tiene el zorrito instalado
    if (typeof window.ethereum === 'undefined') {
      alert("¡No detecto MetaMask! Por favor, instala la extensión para continuar.");
      return;
    }

    try {
      setCargando(true);

      // 2. Pedimos permiso para conectar la billetera
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const sender = accounts;

      // 3. Forzamos el GPS hacia la Red Base (El código de Base es 8453, en Hexadecimal es 0x2105)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x2105') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], 
          });
        } catch (switchError) {
          alert("Debes cambiar tu red a Base para recargar.");
          setCargando(false);
          return;
        }
      }

      // 4. Preparamos el misil: 0.0003 ETH (aprox $0.90 USD). MetaMask requiere esto en formato Hexadecimal (Wei).
      const amountInWei = BigInt(300000000000000); 
      const amountHex = '0x' + amountInWei.toString(16);

      // 5. ¡FUEGO DIRECTO! Sin pasar por DePay, directo a la blockchain
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: sender,
            to: '0x01DA0aE56760592C384E7c1A0632b753cF51F683', // Tu bóveda
            value: amountHex,
          },
        ],
      });

      console.log('✅ Disparo confirmado en la blockchain. Recibo:', txHash);
      
      // 6. Reportamos el impacto a tu Cuartel General (Prisma)
      const response = await fetch('https://api.fansmio.com/api/depay/confirmar', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: txHash,
          userId: userId,
          amount: 1.00 // Inyectamos el saldo
        })
      });

      if (response.ok) {
        alert('¡Bóveda actualizada! Saldo inyectado con éxito. 🚀');
        window.location.reload(); 
      } else {
        alert('El dinero está a salvo, pero hubo un error actualizando la pantalla.');
      }

    } catch (error) {
      console.error("❌ Misión abortada o rechazada por el Fan:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <button 
      onClick={iniciarPagoNativo}
      disabled={cargando}
      className="w-full bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:scale-100"
    >
      {cargando ? 'Despertando a MetaMask...' : 'Recargar $1.00 (Prueba)'}
    </button>
  );
}